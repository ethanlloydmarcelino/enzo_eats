import type { AppSyncIdentityCognito } from 'aws-lambda'
import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/data'
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime'
import { env } from '$amplify/env/review-order'
import type { Schema } from '../../data/resource'

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env)
Amplify.configure(resourceConfig, libraryOptions)
const client = generateClient<Schema>()

const ADMIN_GROUPS = ['admin', 'super_admin']

const fail = (message: string): never => {
  throw new Error(message)
}

export const handler: Schema['reviewOrder']['functionHandler'] = async (event) => {
  const identity = event.identity as AppSyncIdentityCognito | undefined
  const claims = (identity?.claims ?? {}) as Record<string, unknown>
  const groups = (claims['cognito:groups'] as string[] | undefined) ?? []
  const actorId = claims.sub as string | undefined

  // AppSync already gated this mutation on the groups; re-check so the Lambda is
  // safe on its own if it is ever wired to another caller.
  const actorRole = ADMIN_GROUPS.find((group) => groups.includes(group))
  if (!actorId || !actorRole) fail('NOT_AUTHORIZED')

  const { orderId, approve, decisionNote } = event.arguments

  const { data: existing } = await client.models.Order.get({ id: orderId })
  if (!existing) fail('ORDER_NOT_FOUND')

  // Decisions are one-way: a second admin cannot silently overturn the first.
  if (existing!.status !== 'AWAITING_APPROVAL') fail('ORDER_ALREADY_DECIDED')

  const now = new Date().toISOString()
  const toStatus = approve ? 'APPROVED' : 'DENIED'

  const { data: order, errors } = await client.models.Order.update({
    id: orderId,
    status: toStatus,
    // Approving a GCash or PayPal order is the admin confirming the money landed.
    paymentVerified: approve && existing!.paymentMethod !== 'CASH',
    decidedAt: now,
    decidedBy: actorId,
    decisionNote: decisionNote?.trim() || null,
  })

  if (errors?.length || !order) fail(errors?.[0]?.message ?? 'ORDER_UPDATE_FAILED')

  // The customer's subscription on their own OrderEvent records is how they hear
  // the outcome, approved or not.
  await client.models.OrderEvent.create({
    orderId,
    owner: existing!.owner,
    type: approve ? 'ORDER_APPROVED' : 'ORDER_DENIED',
    fromStatus: 'AWAITING_APPROVAL',
    toStatus,
    actorId,
    actorRole,
    message: decisionNote?.trim() || null,
    occurredAt: now,
  })

  return order
}
