import { defineStorage } from '@aws-amplify/backend'

export const storage = defineStorage({
  name: 'enzoEatsPhotos',
  access: (allow) => ({
    'profile-pictures/{entity_id}/*': [allow.entity('identity').to(['read', 'write', 'delete'])],
    'site/*': [allow.guest.to(['read']), allow.authenticated.to(['read'])],
  }),
})
