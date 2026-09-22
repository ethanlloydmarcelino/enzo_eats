import assert from 'node:assert/strict'
import test from 'node:test'
import { validateSubscription } from '../amplify/functions/web-push/validation'

const keys = { p256dh: 'a'.repeat(87), auth: 'b'.repeat(22) }
test('Only HTTPS browser push services can be registered', () => {
  for (const host of [
    'fcm.googleapis.com',
    'updates.push.services.mozilla.com',
    'web.push.apple.com',
    'wns2-db5p.notify.windows.com',
  ])
    assert.equal(
      validateSubscription({ endpoint: `https://${host}/push/test`, keys }).endpoint,
      `https://${host}/push/test`,
    )
  for (const endpoint of [
    'http://fcm.googleapis.com/a',
    'https://localhost/a',
    'https://web.push.apple.com.evil.test/a',
    'https://evilpush.apple.com/a',
    'https://notify.windows.com.evil.test/a',
    'https://evilnotify.windows.com/a',
    'https://user@wns2-db5p.notify.windows.com/a',
    'https://169.254.169.254/latest',
    'https://fcm.googleapis.com.evil.test/a',
    'https://user@web.push.apple.com/a',
    'https://web.push.apple.com:8443/a',
  ])
    assert.throws(() => validateSubscription({ endpoint, keys }))
  assert.throws(() => validateSubscription({ endpoint: 'https://web.push.apple.com/a', keys: {} }))
})

for (const [browser, endpoint] of [
  ['Chrome', 'https://fcm.googleapis.com/fcm/send/test-subscription'],
  ['Safari', 'https://web.push.apple.com/QTestSubscription'],
  ['Apple provider subdomain', 'https://test.push.apple.com/QTestSubscription'],
]) {
  test(browser + ' subscriptions accept browser objects and AppSync JSON', () => {
    const subscription = { endpoint, expirationTime: null, keys }
    for (const input of [subscription, JSON.stringify(subscription)]) {
      assert.deepEqual(validateSubscription(input), { endpoint, keys })
    }
  })
}
