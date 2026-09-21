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

export const transitionAllowed = (from: string, to: string) =>
  (
    ({
      AWAITING_APPROVAL: ['APPROVED', 'DENIED'],
      APPROVED: ['PREPARING'],
      PREPARING: ['READY'],
      READY: ['COMPLETED'],
    }) as Record<string, string[]>
  )[from]?.includes(to) ?? false

export const priceOrder = (
  lines: { menuId: number; quantity: number; option?: string | null }[],
  method: string,
  reference = '',
) => {
  if (method === 'PAYPAL') throw new Error('PAYPAL_NOT_AVAILABLE')
  if (!['CASH', 'GCASH'].includes(method)) throw new Error('INVALID_PAYMENT_METHOD')
  if (!Array.isArray(lines) || !lines.length) throw new Error('EMPTY_CART')
  if (lines.length > MAX_LINES) throw new Error('CART_TOO_LARGE')
  if (method === 'GCASH' && !isValidGcashReference(reference))
    throw new Error('GCASH_REFERENCE_INVALID')
  return lines.map((line) => {
    const item = MENU_PRICES[line.menuId]
    if (!item) throw new Error('UNKNOWN_ITEM')
    if (
      !Number.isInteger(line.quantity) ||
      line.quantity < 1 ||
      line.quantity > MAX_QUANTITY_PER_LINE
    )
      throw new Error('INVALID_QUANTITY')
    const flavors: Record<string, string> = {
      blueberry: 'Blueberry',
      strawberry: 'Strawberry',
      'green-apple': 'Green Apple',
      lychee: 'Lychee',
    }
    const option = line.option?.toLowerCase().replace(/ /g, '-')
    if (line.menuId === 5 && (!option || !flavors[option])) throw new Error('INVALID_OPTION')
    if (line.menuId !== 5 && option) throw new Error('INVALID_OPTION')
    return {
      menuId: line.menuId,
      name: item.name,
      category: item.category,
      option: option ? flavors[option] : null,
      unitPrice: item.price,
      quantity: line.quantity,
      lineTotal: round2(item.price * line.quantity),
    }
  })
}
