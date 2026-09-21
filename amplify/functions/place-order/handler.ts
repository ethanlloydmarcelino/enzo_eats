import type { AppSyncIdentityCognito } from 'aws-lambda'
import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/data'
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime'
import { env } from '$amplify/env/place-order'
import type { Schema } from '../../data/resource'
import {
  CURRENCY,
  MAX_LINES,
  MAX_QUANTITY_PER_LINE,
  MENU_PRICES,
  PAYPAL_MINIMUM,
  isValidGcashReference,
  normalizeGcashReference,
  round2,
} from '../shared/checkout'

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env)
Amplify.configure(resourceConfig, libraryOptions)
const client = generateClient<Schema>()

type Line = Schema['OrderLine']['type']
type Arguments = {
  paymentMethod: 'CASH' | 'GCASH' | 'PAYPAL'
  paymentReference?: string | null
  note?: string | null
  lines: Line[]
}

const fail = (message: string): never => {
  throw new Error(message)
}

// A short, human-sayable handle for the counter — the UUID stays the real key.
const orderNumber = () => {
  const now = new Date()
  const stamp = now.toISOString().slice(2, 10).replace(/-/g, '')
  const suffix = Math.floor(Math.random() * 46656)
    .toString(36)
    .toUpperCase()
    .padStart(3, '0')
  return `EE-${stamp}-${suffix}`
}

export const handler: Schema['placeOrder']['functionHandler'] = async (event) => {
  const identity = event.identity as AppSyncIdentityCognito | undefined
  const claims = (identity?.claims ?? {}) as Record<string, string>
  const owner = claims.sub
  if (!owner) fail('NOT_AUTHENTICATED')

  const { paymentMethod, lines, note } = event.arguments as Arguments
  const reference = (event.arguments as Arguments).paymentReference?.trim() ?? ''

  if (!Array.isArray(lines) || lines.length === 0) fail('EMPTY_CART')
  if (lines.length > MAX_LINES) fail('CART_TOO_LARGE')

  // Reprice every line from the server table; the client's prices are ignored.
  const priced = lines.map((line) => {
    const item = MENU_PRICES[line.menuId]
    if (!item) fail('UNKNOWN_ITEM')
    const quantity = Math.trunc(line.quantity)
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_LINE) {
      fail('INVALID_QUANTITY')
    }
    return {
      menuId: line.menuId,
      name: item.name,
      option: line.option ?? null,
      category: item.category,
      unitPrice: item.price,
      quantity,
      lineTotal: round2(item.price * quantity),
    }
  })

  const subtotal = round2(priced.reduce((sum, line) => sum + line.lineTotal, 0))

  if (paymentMethod === 'PAYPAL' && subtotal <= PAYPAL_MINIMUM) fail('PAYPAL_MINIMUM_NOT_MET')
  if (paymentMethod === 'GCASH' && !isValidGcashReference(reference))
    fail('GCASH_REFERENCE_INVALID')

  const required = ['given_name', 'family_name', 'email', 'phone_number'] as const
  if (required.some((claim) => !claims[claim])) fail('PROFILE_INCOMPLETE')

  const now = new Date().toISOString()
  const { data: order, errors } = await client.models.Order.create({
    orderNumber: orderNumber(),
    owner,
    // Every payment path lands here. Cash and GCash wait for an admin; PayPal
    // waits for the same review while the paypal.me flow is manual.
    status: 'AWAITING_APPROVAL',
    paymentMethod,
    paymentReference: paymentMethod === 'GCASH' ? normalizeGcashReference(reference) : null,
    paymentVerified: false,
    customerFirstName: claims.given_name,
    customerLastName: claims.family_name,
    customerEmail: claims.email,
    customerPhone: claims.phone_number,
    customerAddress: claims.address ?? null,
    lines: priced,
    subtotal,
    total: subtotal,
    currency: CURRENCY,
    note: note?.trim() || null,
    placedAt: now,
  })

  if (errors?.length || !order) fail(errors?.[0]?.message ?? 'ORDER_CREATE_FAILED')

  // The event record is what the admin console's live feed and the audit trail
  // both read; creating it is what "notifies" the admins.
  await client.models.OrderEvent.create({
    orderId: order!.id,
    owner,
    type: 'ORDER_PLACED',
    toStatus: 'AWAITING_APPROVAL',
    actorId: owner,
    actorRole: 'user',
    message:
      paymentMethod === 'GCASH'
        ? `GCash reference ${normalizeGcashReference(reference)} submitted for verification.`
        : paymentMethod === 'PAYPAL'
          ? 'PayPal payment declared; awaiting admin verification.'
          : 'Cash on pickup; awaiting admin approval.',
    occurredAt: now,
  })

  return order
}
