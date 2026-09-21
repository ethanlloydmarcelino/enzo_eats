import assert from 'node:assert/strict'
import test from 'node:test'
import { validateSubscription } from '../amplify/functions/web-push/validation'

const keys = { p256dh: 'a'.repeat(87), auth: 'b'.repeat(22) }
test('Only HTTPS browser push services can be registered', () => {
  for (const host of [
    'fcm.googleapis.com',
    'updates.push.services.mozilla.com',
    'web.push.apple.com',
  ])
    assert.equal(
      validateSubscription({ endpoint: `https://${host}/push/test`, keys }).endpoint,
      `https://${host}/push/test`,
    )
  for (const endpoint of [
    'http://fcm.googleapis.com/a',
    'https://localhost/a',
    'https://169.254.169.254/latest',
    'https://fcm.googleapis.com.evil.test/a',
    'https://user@web.push.apple.com/a',
    'https://web.push.apple.com:8443/a',
  ])
    assert.throws(() => validateSubscription({ endpoint, keys }))
  assert.throws(() => validateSubscription({ endpoint: 'https://web.push.apple.com/a', keys: {} }))
})
