import { defineFunction } from '@aws-amplify/backend'
export const menuCatalog = defineFunction({
  name: 'menu-catalog',
  entry: './handler.ts',
  timeoutSeconds: 60,
  resourceGroupName: 'data',
})
