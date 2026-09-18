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
  // Preserve the existing pool's schema. The trigger enforces required profile
  // fields because Cognito cannot make existing optional attributes required.
  groups: ['super_admin', 'admin', 'user'],
  triggers: { preSignUp, postConfirmation },
  access: (allow) => [allow.resource(postConfirmation).to(['addUserToGroup'])],
})
