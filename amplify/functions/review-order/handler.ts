import type { AppSyncIdentityCognito, AppSyncResolverEvent } from 'aws-lambda'
import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/data'
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime'
import { env } from '$amplify/env/review-order'
import type { Schema } from '../../data/resource'
import { orderSelection } from '../shared/order-selection'
import { transitionAllowed } from '../shared/checkout'

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env)
Amplify.configure(resourceConfig, libraryOptions)
const client = generateClient<Schema>()

const ADMIN_GROUPS = ['super_admin', 'admin']

const fail = (message: string): never => {
  throw new Error(message)
}

export const handler = async (
  event: AppSyncResolverEvent<{
    orderId: string
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
  const reviewing = event.info.fieldName === 'reviewOrder'
  const toStatus = reviewing ? (approve ? 'APPROVED' : 'DENIED') : event.arguments.status!
  if (!reviewing && !['PREPARING', 'READY', 'COMPLETED'].includes(toStatus))
    fail('INVALID_TRANSITION')
  if (!transitionAllowed(existing!.status, toStatus)) fail('ORDER_ALREADY_DECIDED')
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
        type: `ORDER_${toStatus}`,
        from: existing!.status,
        status: toStatus,
        at: now,
        actorId,
        actorRole,
        note: decisionNote?.trim() || null,
      },
    ]),
    // Cash is not marked paid merely because its pickup is approved.
    paymentVerified: reviewing
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
    variables: { input, condition: { status: { eq: existing!.status } } },
  })) as { data?: { updateOrder?: Schema['Order']['type'] }; errors?: { message: string }[] }
  const order = result.data?.updateOrder
  const errors = result.errors

  if (errors?.length || !order) fail(errors?.[0]?.message ?? 'ORDER_UPDATE_FAILED')

  const eventWrite = await client.models.OrderEvent.create({
    id: `${orderId}:${toStatus}`,
    orderId,
    owner: existing!.owner,
    type: `ORDER_${toStatus}`,
    fromStatus: existing!.status,
    toStatus,
    actorId,
    actorRole,
    message: decisionNote?.trim() || null,
    occurredAt: now,
  })
  if (eventWrite.errors?.length) console.error('ORDER_EVENT_WRITE_FAILED', { orderId })

  return order
}
