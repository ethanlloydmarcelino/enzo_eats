/**
 * Canonical checkout rules. The Lambda is the authority: prices come from this
 * table, never from the request, so a tampered client cannot buy a ₱70 meal for
 * ₱1. `src/checkout/rules.js` mirrors the thresholds for UI copy only.
 */
export const CURRENCY = 'PHP'

// PayPal's per-transaction fees make it uneconomic on small baskets, so it is
// offered only strictly above this subtotal.
export const PAYPAL_MINIMUM = 500

export const MENU_PRICES: Record<number, { name: string; category: string; price: number }> = {
  1: { name: 'Chicken Poppers', category: 'food', price: 60 },
  2: { name: 'Chicken Tocino', category: 'food', price: 70 },
  3: { name: 'Cordon Blue', category: 'food', price: 70 },
  4: { name: 'Shomai Rice', category: 'food', price: 60 },
  5: { name: 'Fruit Soda', category: 'drink', price: 39 },
}

export const MAX_QUANTITY_PER_LINE = 50
export const MAX_LINES = 40

// GCash reference numbers are 13 digits, but the app accepts the spaced forms
// people copy out of the receipt.
export const GCASH_REFERENCE_PATTERN = /^\d{10,16}$/

export const normalizeGcashReference = (value: string) => value.replace(/[\s-]/g, '')

export const isValidGcashReference = (value: string) =>
  GCASH_REFERENCE_PATTERN.test(normalizeGcashReference(value))

export const round2 = (value: number) => Math.round(value * 100) / 100
