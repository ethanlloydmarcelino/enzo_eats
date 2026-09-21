import { defineFunction } from '@aws-amplify/backend'

export const reviewOrder = defineFunction({
  name: 'review-order',
  entry: './handler.ts',
  timeoutSeconds: 30,
})
