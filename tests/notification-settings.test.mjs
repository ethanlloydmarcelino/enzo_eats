import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { createStore } from 'zustand/vanilla'

// Execute the settings controller with browser and push-service test doubles.
const source = readFileSync(new URL('../src/notifications/settings.js', import.meta.url), 'utf8')
  .replace(/import[\s\S]*?from ['"][^'"]+['"]\s*/g, '')
  .replace('export const useNotificationSettings =', 'globalThis.store =')

function setup({
  permission = 'default',
  preference = null,
  subscription = null,
  fail = false,
} = {}) {
  const calls = []
  const context = {
    create: createStore,
    Notification: { permission },
    navigator: {
      serviceWorker: {
        getRegistration: async () => ({
          pushManager: { getSubscription: async () => subscription },
        }),
      },
    },
    supportsPush: () => true,
    notificationPreference: () => preference,
    reconcilePushOwner: async () => {},
    enablePush: async (owner) => {
      calls.push(['enable', owner])
      if (fail) throw new Error(typeof fail === 'string' ? fail : 'API unavailable')
    },
    disablePush: async () => {
      calls.push(['disable'])
    },
    allowSignupNotifications: async () => {
      calls.push(['guest'])
    },
  }
  runInNewContext(source, context)
  return { store: context.store, calls }
}
test('first load without consent stays off without requesting browser permission', async () => {
  const { store, calls } = setup()
  await store.getState().refresh('customer')
  assert.equal(store.getState().ready, true)
  assert.equal(store.getState().enabled, false)
  assert.deepEqual(calls, [])
})
test('existing consent binds alerts to the signed-in customer', async () => {
  const { store, calls } = setup({ permission: 'granted', preference: 'true' })
  await store.getState().refresh('customer')
  assert.equal(store.getState().enabled, true)
  assert.deepEqual(calls, [['enable', 'customer']])
})
test('turning off remains off even if browser permission is granted', async () => {
  const { store, calls } = setup({ permission: 'granted', preference: 'false' })
  await store.getState().refresh('customer')
  assert.equal(store.getState().enabled, false)
  assert.deepEqual(calls, [])
})
test('revoked browser permission overrides saved consent', async () => {
  const { store, calls } = setup({ permission: 'denied', preference: 'true' })
  await store.getState().refresh('customer')
  assert.equal(store.getState().enabled, false)
  assert.deepEqual(calls, [])
})
test('failed backend registration does not report notifications enabled', async () => {
  const { store } = setup({ fail: true })
  assert.equal(await store.getState().change(true, 'customer'), false)
  assert.equal(store.getState().enabled, false)
  assert.equal(store.getState().message, 'API unavailable')
  assert.equal(store.getState().busy, false)
})
test('guest consent and turning off use the appropriate browser actions', async () => {
  const { store, calls } = setup()
  assert.equal(await store.getState().change(true), true)
  assert.equal(store.getState().enabled, true)
  assert.equal(await store.getState().change(false), true)
  assert.equal(store.getState().enabled, false)
  assert.deepEqual(calls, [['guest'], ['disable']])
})

test('subscription validation failures show a helpful message instead of a backend code', async () => {
  const { store } = setup({ fail: 'INVALID_SUBSCRIPTION' })
  await store.getState().change(true, 'customer')
  assert.equal(store.getState().enabled, false)
  assert.match(store.getState().message, /browser could not register/)
  assert.doesNotMatch(store.getState().message, /INVALID_SUBSCRIPTION/)
})
