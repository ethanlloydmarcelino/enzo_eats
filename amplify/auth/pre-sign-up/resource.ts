import { defineFunction } from '@aws-amplify/backend'

export const preSignUp = defineFunction({
  name: 'validate-sign-up',
  resourceGroupName: 'auth',
})
