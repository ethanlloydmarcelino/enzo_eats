import { create } from 'zustand'
import { roleFromGroups } from './roles'

// Injecting the SDK lets session and checkout behavior be tested without AWS.
export const createAuthStore = (api) => {
  let revision = 0
  return create((set, get) => ({
    user: null,
    attributes: null,
    role: null,
    status: 'loading',
    sessionError: false,
    accountOpen: false,
    returnToCart: false,
    openAccount: (returnToCart = false) => set({ accountOpen: true, returnToCart }),
    closeAccount: () => set({ accountOpen: false, returnToCart: false }),
    clearSession: () => {
      revision += 1
      set({ user: null, attributes: null, role: null, status: 'signedOut', sessionError: false })
    },
    refreshSession: async ({ afterSignIn = false } = {}) => {
      const request = ++revision
      set({ status: 'loading', sessionError: false })
      try {
        const user = await api.getCurrentUser()
        const [attributes, session] = await Promise.all([
          api.fetchUserAttributes(),
          api.fetchAuthSession(),
        ])
        const role = roleFromGroups(session.tokens?.accessToken?.payload['cognito:groups'])
        if (request !== revision) return false
        set({ user, attributes, role, status: 'signedIn' })
        return true
      } catch (error) {
        if (request !== revision) return false
        const signedOut =
          !afterSignIn &&
          ['UserUnAuthenticatedException', 'NotAuthorizedException'].includes(error.name)
        set({
          user: null,
          attributes: null,
          role: null,
          status: signedOut ? 'signedOut' : 'error',
          sessionError: !signedOut,
        })
        return false
      }
    },
    completeSignIn: async () => {
      const restored = await get().refreshSession({ afterSignIn: true })
      // A newer auth event can supersede this request. Only a confirmed store
      // session counts as success; never clear the form on a failed restoration.
      if (!restored && get().status !== 'signedIn') {
        throw Object.assign(new Error('Unable to restore the signed-in session.'), {
          name: 'SessionRestoreError',
        })
      }
    },
    saveProfile: async (attributes) => {
      await api.updateUserAttributes({ userAttributes: attributes })
      if (!(await get().refreshSession())) throw new Error('Session refresh failed')
    },
    logOut: async () => {
      await api.signOut()
      get().clearSession()
    },
  }))
}
