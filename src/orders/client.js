import { generateClient } from 'aws-amplify/data'

// A single shared client; generateClient() per render would leak subscriptions.
export const dataClient = generateClient()

// Cart entries carry display shapes (localized names, image requires) that the
// API has no field for. Only the identifying facts are sent — the Lambda looks
// up the authoritative name, category and price itself.
export const cartToLines = (cart, language = 'en') =>
  cart.map((item) => ({
    menuId: item.id,
    name: typeof item.name === 'string' ? item.name : (item.name?.[language] ?? ''),
    option: item.selectedOption ? item.selectedOption.id : null,
    category: item.category ?? null,
    unitPrice: item.price,
    quantity: item.quantity,
    lineTotal: item.price * item.quantity,
  }))

const messageKeys = {
  PAYPAL_NOT_AVAILABLE: 'orderErrorFailed',
  INVALID_OPTION: 'orderErrorUnknownItem',
  REQUEST_ALREADY_USED: 'orderErrorFailed',
  EMPTY_CART: 'orderErrorEmptyCart',
  CART_TOO_LARGE: 'orderErrorCartTooLarge',
  UNKNOWN_ITEM: 'orderErrorUnknownItem',
  INVALID_QUANTITY: 'orderErrorQuantity',
  GCASH_REFERENCE_INVALID: 'orderErrorGcashReference',
  PROFILE_INCOMPLETE: 'orderErrorProfile',
  NOT_AUTHENTICATED: 'orderErrorSignedOut',
  NOT_AUTHORIZED: 'orderErrorNotAuthorized',
  ORDER_NOT_FOUND: 'orderErrorNotFound',
  ORDER_ALREADY_DECIDED: 'orderErrorAlreadyDecided',
  ConditionalCheckFailed: 'orderErrorAlreadyDecided',
}

// AppSync wraps a thrown Lambda error, so match on the code appearing anywhere
// in the message rather than on equality.
export const orderErrorKey = (error) => {
  const text = [error?.message, ...(error?.errors ?? []).map((item) => item?.message)]
    .filter(Boolean)
    .join(' ')
  const match = Object.keys(messageKeys).find((code) => text.includes(code))
  return match ? messageKeys[match] : 'orderErrorFailed'
}

export const throwOnErrors = (result) => {
  if (result?.errors?.length) {
    const error = new Error(result.errors[0].message)
    error.errors = result.errors
    throw error
  }
  return result.data
}

export const listAll = async (fetchPage) => {
  const items = []
  let nextToken
  do {
    const page = await fetchPage(nextToken)
    items.push(...throwOnErrors(page))
    nextToken = page.nextToken
  } while (nextToken)
  return items
}
