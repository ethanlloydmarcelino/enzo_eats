import { defineFunction } from '@aws-amplify/backend'

export const webPush = defineFunction({
  name: 'web-push',
  entry: './handler.ts',
  resourceGroupName: 'data',
  timeoutSeconds: 60,
})
