import { defineAuth } from '@aws-amplify/backend'
import { preSignUp } from './pre-sign-up/resource'
import { postConfirmation } from './post-confirmation/resource'

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    givenName: { required: true, mutable: true },
    familyName: { required: true, mutable: true },
    phoneNumber: { required: true, mutable: true },
    address: { required: false, mutable: true },
    // Maps to the standard `picture` claim the account page reads for the avatar.
    profilePicture: { required: false, mutable: true },
  },
  groups: ['super_admin', 'admin', 'user'],
  triggers: { preSignUp, postConfirmation },
  access: (allow) => [allow.resource(postConfirmation).to(['addUserToGroup'])],
})
