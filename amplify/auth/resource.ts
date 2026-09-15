import { defineAuth } from '@aws-amplify/backend'

/**
 * Starter auth resource. Enable this once the app needs sign-in (e.g. order
 * history, saved favorites tied to an account). Until then, Data below is
 * reachable via API key so the storefront can stay anonymous.
 * https://docs.amplify.aws/react-native/build-a-backend/auth/
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
})
