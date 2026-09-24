import type { AppSyncIdentityCognito } from 'aws-lambda'
import { createHash } from 'node:crypto'
import {
  AdminGetUserCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider'
import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/data'
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime'
import { env } from '$amplify/env/place-order'
import type { Schema } from '../../data/resource'
import { CURRENCY, priceOrder, normalizeGcashReference, round2 } from '../shared/checkout'

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env)
Amplify.configure(resourceConfig, libraryOptions)
const client = generateClient<Schema>()

type Line = Schema['OrderLine']['type']
type Arguments = {
  requestId: string
  paymentMethod: 'CASH' | 'GCASH' | 'PAYPAL'
  paymentReference?: string | null
  note?: string | null
  lines: Line[]
}

const fail = (message: string): never => {
  throw new Error(message)
}

// A short, human-sayable handle for the counter — the UUID stays the real key.
const orderNumber = (id: string) => {
  const now = new Date()
  const stamp = now.toISOString().slice(2, 10).replace(/-/g, '')
  const suffix = id.slice(0, 10).toUpperCase()
  return `EE-${stamp}-${suffix}`
}

export const handler: Schema['placeOrder']['functionHandler'] = async (event) => {
  const identity = event.identity as AppSyncIdentityCognito | undefined
  const claims = (identity?.claims ?? {}) as Record<string, string>
  const owner = claims.sub
  if (!owner) fail('NOT_AUTHENTICATED')

  const { paymentMethod, lines, note, requestId } = event.arguments as Arguments
  const reference = (event.arguments as Arguments).paymentReference?.trim() ?? ''

  if (!/^[a-zA-Z0-9-]{16,80}$/.test(requestId)) fail('INVALID_REQUEST_ID')
  if ((note?.length ?? 0) > 500) fail('NOTE_TOO_LONG')
  const priced = priceOrder(lines, paymentMethod, reference)
  const id = createHash('sha256').update(`${owner}:${requestId}`).digest('hex')
  const requestHash = createHash('sha256')
    .update(
      JSON.stringify({
        priced,
        paymentMethod,
        reference: normalizeGcashReference(reference),
        note: note?.trim() ?? '',
      }),
    )
    .digest('hex')
  const previous = await client.models.Order.get({ id })
  if (previous.errors?.length) fail('ORDER_READ_FAILED')
  if (previous.data) {
    if (previous.data.requestHash !== requestHash) fail('REQUEST_ALREADY_USED')
    return previous.data
  }

  const subtotal = round2(priced.reduce((sum, line) => sum + line.lineTotal, 0))

  // Access tokens do not contain profile attributes. Read the current profile
  // from Cognito using the authenticated identity, never customer-supplied data.
  const profile = await new CognitoIdentityProviderClient({}).send(
    new AdminGetUserCommand({
      UserPoolId: process.env.USER_POOL_ID!,
      Username: identity!.username,
    }),
  )
  const attributes = Object.fromEntries(
    (profile.UserAttributes ?? []).map((a) => [a.Name!, a.Value ?? '']),
  )
  const required = ['given_name', 'family_name', 'email', 'phone_number'] as const
  if (required.some((claim) => !attributes[claim]?.trim())) fail('PROFILE_INCOMPLETE')

  const now = new Date().toISOString()
  const { data: order, errors } = await client.models.Order.create({
    id,
    requestHash,
    history: JSON.stringify([
      {
        type: 'ORDER_PLACED',
        status: 'AWAITING_APPROVAL',
        at: now,
        actorId: owner,
        actorName: [attributes.given_name, attributes.family_name].join(' '),
        actorRole: 'customer',
      },
    ]),
    orderNumber: orderNumber(id),
    owner,
    status: 'AWAITING_APPROVAL',
    paymentMethod,
    paymentReference: paymentMethod === 'GCASH' ? normalizeGcashReference(reference) : null,
    paymentVerified: false,
    customerFirstName: attributes.given_name,
    customerLastName: attributes.family_name,
    customerEmail: attributes.email,
    customerPhone: attributes.phone_number,
    customerAddress: attributes.address || null,
    lines: priced,
    subtotal,
    total: subtotal,
    currency: CURRENCY,
    note: note?.trim() || null,
    placedAt: now,
  })

  if (errors?.length || !order) {
    const concurrent = await client.models.Order.get({ id })
    if (concurrent.data?.requestHash === requestHash) return concurrent.data
    fail('ORDER_CREATE_FAILED')
  }

  // Notifications subscribe to the durable Order mutation. This secondary feed
  // may fail independently; the history above remains part of the order write.
  const eventWrite = await client.models.OrderEvent.create({
    id: `${id}:placed`,
    orderId: order!.id,
    owner,
    type: 'ORDER_PLACED',
    toStatus: 'AWAITING_APPROVAL',
    actorId: owner,
    actorRole: 'user',
    message:
      paymentMethod === 'GCASH'
        ? `GCash reference ${normalizeGcashReference(reference)} submitted for verification.`
        : 'Cash on pickup; awaiting admin approval.',
    occurredAt: now,
  })
  if (eventWrite.errors?.length) console.error('ORDER_EVENT_WRITE_FAILED', { orderId: id })

  return order
}
