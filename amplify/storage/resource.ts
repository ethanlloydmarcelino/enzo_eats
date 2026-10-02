import { defineStorage } from '@aws-amplify/backend'
export const storage = defineStorage({
  name: 'menuPhotoLibrary',
  access: (allow) => ({
    'menu-images/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read']),
      allow.groups(['user']).to(['read']),
      allow.groups(['admin', 'super_admin']).to(['read', 'write']),
    ],
  }),
})
