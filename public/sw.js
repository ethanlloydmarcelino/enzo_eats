self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
self.addEventListener('push', (event) => {
  let message = {}
  try {
    message = event.data?.json() ?? {}
  } catch {
    /* Always show a visible notice. */
  }
  event.waitUntil(
    self.registration.showNotification(message.title || 'Enzo Eats', {
      body: message.body || 'You have a new account update.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: message.tag || 'enzo-update',
      data: { url: message.url || '/account' },
    }),
  )
})
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = new URL(event.notification.data?.url || '/account', self.location.origin)
  if (target.origin !== self.location.origin) return
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of windows) {
        if (new URL(client.url).origin === target.origin) {
          await client.navigate(target.href)
          return client.focus()
        }
      }
      return self.clients.openWindow(target.href)
    })(),
  )
})
