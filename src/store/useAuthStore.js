import * as auth from 'aws-amplify/auth'
import { Hub } from 'aws-amplify/utils'
import { createAuthStore } from '../auth/createAuthStore'
import { disablePush } from '../notifications/push'

export const useAuthStore = createAuthStore({
  ...auth,
  signOut: async (...args) => {
    await disablePush()
    return auth.signOut(...args)
  },
})

export const listenToAuth = () => {
  const stop = Hub.listen('auth', ({ payload }) => {
    const store = useAuthStore.getState()
    if (payload.event === 'signedOut' || payload.event === 'tokenRefresh_failure') {
      store.clearSession()
    }
    if (payload.event === 'signedIn') void store.refreshSession()
  })
  void useAuthStore.getState().refreshSession()
  return stop
}
