// Merchant payment details and the client-side mirror of the checkout rules in
// amplify/functions/shared/checkout.ts. These drive copy and which buttons are
// enabled; the Lambda re-checks every one of them before an order is written.
export const GCASH_NUMBER = '0916-408-2529'
export const GCASH_NAME = 'Enzo Eats'

// PayPal is offered only for baskets strictly above this subtotal.
export const PAYPAL_MINIMUM = 500

export const paypalAvailable = (subtotal) => subtotal > PAYPAL_MINIMUM

export const normalizeGcashReference = (value) => (value ?? '').replace(/[\s-]/g, '')

export const isValidGcashReference = (value) => /^\d{10,16}$/.test(normalizeGcashReference(value))
