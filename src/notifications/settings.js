import { create } from 'zustand'
import {
  allowSignupNotifications,
  disablePush,
  enablePush,
  notificationPreference,
  reconcilePushOwner,
  supportsPush,
} from './push'

const notificationError = (error) => {
  const message = error?.message || ''
  if (message.includes('INVALID_SUBSCRIPTION'))
    return 'This browser could not register device notifications. Please try again after updating your browser, or use another browser.'
  if (message.includes('DEVICE_LIMIT'))
    return 'Your account has reached its notification device limit. Turn notifications off on another device and try again.'
  return message || 'Notifications could not be updated. Please try again.'
}

export const useNotificationSettings = create((set, get) => ({
  enabled: false,
  ready: false,
  busy: false,
  message: '',
  refresh: async (owner) => {
    if (get().busy) return
    set({ busy: true })
    try {
      await reconcilePushOwner(owner)
      const permitted = supportsPush() && Notification.permission === 'granted'
      const preference = notificationPreference()
      const registration = permitted ? await navigator.serviceWorker.getRegistration('/') : null
      const subscription = await registration?.pushManager.getSubscription()
      const enabled = !!(
        permitted &&
        preference !== 'false' &&
        (subscription || preference === 'true')
      )
      if (enabled && owner) await enablePush(owner)
      set({ enabled, message: '' })
    } catch (error) {
      set({ enabled: false, message: notificationError(error) })
    } finally {
      set({ ready: true, busy: false })
    }
  },
  change: async (enabled, owner) => {
    if (get().busy) return false
    set({ busy: true, message: '' })
    try {
      await (enabled ? (owner ? enablePush(owner) : allowSignupNotifications()) : disablePush())
      set({
        enabled,
        message: enabled
          ? 'Notifications are enabled on this device.'
          : 'Notifications are off on this device.',
      })
      return true
    } catch (error) {
      set({ message: notificationError(error) })
      return false
    } finally {
      set({ busy: false })
    }
  },
}))
