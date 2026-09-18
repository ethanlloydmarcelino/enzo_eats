import { defineFunction } from '@aws-amplify/backend'

export const postConfirmation = defineFunction({
  name: 'assign-default-role',
  resourceGroupName: 'auth',
})
