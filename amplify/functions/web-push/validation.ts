// Only browser push providers may be contacted; never fetch arbitrary client URLs.
export const validateSubscription = (input: unknown) => {
  const value = typeof input === 'string' ? JSON.parse(input) : input
  const url = new URL(value?.endpoint)
  const allowed = [
    'fcm.googleapis.com',
    'updates.push.services.mozilla.com',
    // Apple documents *.push.apple.com for Safari and Home Screen web apps.
    'push.apple.com',
    'notify.windows.com',
  ]
  if (
    url.protocol !== 'https:' ||
    url.port ||
    url.username ||
    url.password ||
    !allowed.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`)) ||
    value.endpoint.length > 2048 ||
    !url.pathname.startsWith('/')
  )
    throw new Error('INVALID_SUBSCRIPTION')
  if (!/^[\w-]{80,100}$/.test(value.keys?.p256dh) || !/^[\w-]{20,30}$/.test(value.keys?.auth))
    throw new Error('INVALID_SUBSCRIPTION_KEYS')
  return {
    endpoint: value.endpoint as string,
    keys: { p256dh: value.keys.p256dh as string, auth: value.keys.auth as string },
  }
}
