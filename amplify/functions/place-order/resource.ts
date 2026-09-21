import { defineFunction } from '@aws-amplify/backend'

export const placeOrder = defineFunction({
  name: 'place-order',
  entry: './handler.ts',
  timeoutSeconds: 30,
})
