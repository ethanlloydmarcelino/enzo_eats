import type { AppSyncIdentityCognito, AppSyncResolverEvent } from 'aws-lambda'
import { Amplify } from 'aws-amplify'
import * as cognito from '@aws-sdk/client-cognito-identity-provider'
import { generateClient } from 'aws-amplify/data'
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime'
import { env } from '$amplify/env/review-order'
import type { Schema } from '../../data/resource'
import { orderSelection } from '../shared/order-selection'
import { transitionAllowed } from '../shared/checkout'

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env)
Amplify.configure(resourceConfig, libraryOptions)
const client = generateClient<Schema>()

const identityClient = new cognito.CognitoIdentityProviderClient({})

const ADMIN_GROUPS = ['super_admin', 'admin']

const fail = (message: string): never => {
  throw new Error(message)
}

export const handler = async (
  event: AppSyncResolverEvent<{
    orderId: string
    flagReason?: string
    expectedUpdatedAt?: string
    approve?: boolean
    decisionNote?: string | null
    status?: Schema['Order']['type']['status']
  }>,
) => {
  const identity = event.identity as AppSyncIdentityCognito | undefined
  const claims = (identity?.claims ?? {}) as Record<string, unknown>
  const groups = (claims['cognito:groups'] as string[] | undefined) ?? []
  const actorId = claims.sub as string | undefined

  // AppSync already gated this mutation on the groups; re-check so the Lambda is
  // safe on its own if it is ever wired to another caller.
  const actorRole = ADMIN_GROUPS.find((group) => groups.includes(group))
  if (!actorId || !actorRole) fail('NOT_AUTHORIZED')

  const { orderId, approve, decisionNote } = event.arguments
  if ((decisionNote?.length ?? 0) > 500) fail('NOTE_TOO_LONG')

  const { data: existing } = await client.models.Order.get({ id: orderId })
  if (!existing) fail('ORDER_NOT_FOUND')

  const now = new Date().toISOString()
  // Amplify function handlers receive arguments and identity, not necessarily
  // the AppSync resolver's info object. These mutations have distinct inputs.
  const flagging = typeof event.arguments.flagReason === 'string'
  const flagReason = event.arguments.flagReason?.trim()
  if (flagging && (!flagReason || flagReason.length > 500)) fail('FLAG_REASON_REQUIRED')
  if (flagging && existing!.status !== 'COMPLETED') fail('ONLY_COMPLETED_CAN_BE_FLAGGED')
  const editingFlag = flagging && !!existing!.flaggedAt
  if (editingFlag && !event.arguments.expectedUpdatedAt) fail('ORDER_ALREADY_FLAGGED')
  if (
    event.arguments.expectedUpdatedAt &&
    (!editingFlag || event.arguments.expectedUpdatedAt !== existing!.updatedAt)
  )
    fail('ORDER_CHANGED_REFRESH')
  const reviewing = typeof approve === 'boolean'
  const toStatus = flagging
    ? 'COMPLETED'
    : reviewing
      ? approve
        ? 'APPROVED'
        : 'DENIED'
      : event.arguments.status!
  const eventType = editingFlag
    ? 'ORDER_FLAG_NOTE_UPDATED'
    : flagging
      ? 'ORDER_FLAGGED'
      : `ORDER_${toStatus}`
  if (toStatus === 'CANCELLED' && !decisionNote?.trim()) fail('CANCELLATION_REASON_REQUIRED')
  if (
    !flagging &&
    !reviewing &&
    !['PREPARING', 'READY', 'COMPLETED', 'CANCELLED'].includes(toStatus)
  )
    fail('INVALID_TRANSITION')
  if (!flagging && !transitionAllowed(existing!.status, toStatus)) fail('ORDER_ALREADY_DECIDED')
  let actorName: string | undefined
  if (flagging) {
    const profile = await identityClient.send(
      new cognito.AdminGetUserCommand({
        UserPoolId: process.env.USER_POOL_ID!,
        Username: identity?.username || actorId!,
      }),
    )
    const attribute = (name: string) =>
      profile.UserAttributes?.find((value) => value.Name === name)?.Value || ''
    actorName =
      [attribute('given_name'), attribute('family_name')].filter(Boolean).join(' ') || undefined
  }
  const history =
    typeof existing!.history === 'string'
      ? JSON.parse(existing!.history)
      : (existing!.history ?? [])

  const input = {
    id: orderId,
    status: toStatus,
    history: JSON.stringify([
      ...history,
      {
        type: eventType,
        from: existing!.status,
        status: toStatus,
        at: now,
        actorId,
        actorRole,
        ...(actorName ? { actorName } : {}),
        note: flagging ? flagReason : decisionNote?.trim() || null,
        ...(editingFlag ? { previousNote: existing!.flagReason } : {}),
      },
    ]),
    ...(flagging
      ? editingFlag
        ? { flagReason }
        : { flaggedAt: now, flaggedBy: actorId, flagReason }
      : {}),
    ...(toStatus === 'CANCELLED' ? { decisionNote: decisionNote!.trim() } : {}),
    // Cash is not marked paid merely because its pickup is approved.
    paymentVerified: flagging
      ? existing!.paymentVerified
      : reviewing
        ? !!approve && existing!.paymentMethod === 'GCASH'
        : existing!.paymentVerified || toStatus === 'COMPLETED',
    ...(reviewing
      ? { decidedAt: now, decidedBy: actorId, decisionNote: decisionNote?.trim() || null }
      : {}),
  }
  // A database condition makes the first decision win even if two admins read
  // the pending order at the same time.
  const result = (await client.graphql({
    query: `mutation Decide($input: UpdateOrderInput!, $condition: ModelOrderConditionInput) {
      updateOrder(input: $input, condition: $condition) { ${orderSelection} }
    }`,
    variables: {
      input,
      condition: { status: { eq: existing!.status }, updatedAt: { eq: existing!.updatedAt } },
    },
  })) as { data?: { updateOrder?: Schema['Order']['type'] }; errors?: { message: string }[] }
  const order = result.data?.updateOrder
  const errors = result.errors

  if (errors?.length || !order) fail(errors?.[0]?.message ?? 'ORDER_UPDATE_FAILED')

  const eventWrite = await client.models.OrderEvent.create({
    id: editingFlag
      ? `${orderId}:FLAG_NOTE_UPDATED:${now}:${existing!.updatedAt}`
      : `${orderId}:${flagging ? 'FLAGGED' : toStatus}`,
    orderId,
    owner: existing!.owner,
    type: eventType,
    fromStatus: existing!.status,
    toStatus,
    actorId,
    actorRole,
    message: flagging ? flagReason : decisionNote?.trim() || null,
    occurredAt: now,
  })
  if (eventWrite.errors?.length) console.error('ORDER_EVENT_WRITE_FAILED', { orderId })

  return order
}
