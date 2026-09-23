import { defineFunction } from '@aws-amplify/backend'
export const manageUsers = defineFunction({
  name: 'manage-users',
  entry: './handler.ts',
  timeoutSeconds: 30,
  resourceGroupName: 'data',
})
