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
    refreshSession: async () => {
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
        const signedOut = ['UserUnAuthenticatedException', 'NotAuthorizedException'].includes(
          error.name,
        )
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
