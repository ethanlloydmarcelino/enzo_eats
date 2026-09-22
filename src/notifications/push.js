import { Platform } from 'react-native'
import { dataClient, throwOnErrors } from '../orders/client'

export const notificationPreference = () => {
  try {
    return localStorage.getItem('enzo-notifications-enabled')
  } catch {
    return null
  }
}
const savePreference = (enabled) => {
  try {
    localStorage.setItem('enzo-notifications-enabled', String(enabled))
  } catch {
    /* Storage may be unavailable. */
  }
}
export const supportsPush = () =>
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  window.isSecureContext &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window
export const registerWorker = async () => {
  if (!supportsPush())
    throw new Error(
      'Install Enzo Eats on your Home Screen and open it there, or use a browser that supports notifications.',
    )
  await navigator.serviceWorker.register('/sw.js')
  return navigator.serviceWorker.ready
}
export const allowSignupNotifications = async () => {
  if (!supportsPush())
    throw new Error('On iPhone, add this app to your Home Screen and open it there first.')
  if ((await Notification.requestPermission()) !== 'granted')
    throw new Error('Notifications were not allowed. Signup results will still appear here.')
  await registerWorker()
  savePreference(true)
}
const manage = async (action, subscription) => {
  const value = throwOnErrors(
    await dataClient.mutations.manageWebPush({
      action,
      subscription: subscription ? JSON.stringify(subscription) : undefined,
    }),
  )
  return typeof value === 'string' ? JSON.parse(value) : value
}
export const enablePush = async (owner) => {
  if (!supportsPush())
    throw new Error(
      'On iPhone, add Enzo Eats to your Home Screen and open it there to enable notifications.',
    )
  // Must happen directly from a tap, before network requests (especially Safari).
  const permission =
    Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
  if (permission !== 'granted')
    throw new Error(
      'Notifications are blocked. You can allow them in your browser or device settings.',
    )
  const { getCurrentUser } = await import('aws-amplify/auth')
  const userId = (await getCurrentUser()).userId
  if (owner && owner !== userId) throw new Error('Your account changed. Please try again.')
  const registration = await registerWorker()
  const { publicKey } = await manage('config')
  const bytes = Uint8Array.from(atob(publicKey.replace(/-/g, '+').replace(/_/g, '/')), (c) =>
    c.charCodeAt(0),
  )
  const subscription =
    (await registration.pushManager.getSubscription()) ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: bytes,
    }))
  await manage('subscribe', subscription.toJSON())
  if ((await getCurrentUser()).userId !== userId) {
    await subscription.unsubscribe()
    throw new Error('Your account changed. Please try again.')
  }
  localStorage.setItem('enzo-push-owner', userId)
  savePreference(true)
  return true
}
export const disablePush = async () => {
  if (!supportsPush()) {
    savePreference(false)
    return
  }
  const registration = await navigator.serviceWorker.getRegistration('/')
  const subscription = await registration?.pushManager.getSubscription()
  if (subscription) {
    // Unsubscribe first: even a failed backend cleanup cannot leave this device receiving alerts.
    const value = subscription.toJSON()
    if (!(await subscription.unsubscribe()))
      throw new Error('Could not turn off this device. Please try again.')
    // The browser endpoint is revoked even if the session has expired.
    await manage('remove', value).catch(() => {})
  }
  localStorage.removeItem('enzo-push-owner')
  savePreference(false)
}
export const reconcilePushOwner = async (owner) => {
  if (!supportsPush()) return
  const previous = localStorage.getItem('enzo-push-owner')
  if (previous && previous !== owner) await disablePush()
}
export const showLocalNotification = async (body, tag = 'signup') => {
  if (
    !supportsPush() ||
    Notification.permission !== 'granted' ||
    notificationPreference() !== 'true'
  )
    return
  try {
    const registration = await registerWorker()
    await registration.showNotification('Enzo Eats', {
      body,
      tag,
      icon: '/icon-192.png',
      data: { url: '/account' },
    })
  } catch {
    /* In-app message remains available. */
  }
}
