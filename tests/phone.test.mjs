import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizePhone, phoneFormValues, phoneCountries } from '../src/auth/phone.mjs'

test('all supported countries convert local numbers to international format', () => {
  for (const [country, local, expected] of [
    ['PH', '0917 123-4567', '+639171234567'],
    ['US', '(202) 555-0123', '+12025550123'],
    ['CA', '4165550123', '+14165550123'],
    ['JP', '09012345678', '+819012345678'],
    ['SG', '81234567', '+6581234567'],
    ['TW', '0912345678', '+886912345678'],
    ['AE', '0501234567', '+971501234567'],
  ]) {
    assert.equal(normalizePhone(local, country), expected)
    assert.equal(normalizePhone(expected, country), expected)
    const form = phoneFormValues(expected)
    assert.equal(normalizePhone(form.phoneNumber, form.phoneCountry), expected)
  }
  assert.equal(phoneCountries.length, 7)
})
test('invalid local numbers and mismatched country codes are rejected', () => {
  for (const [value, country] of [
    ['0917', 'PH'],
    ['091712345678', 'PH'],
    ['abc09171234567', 'PH'],
    ['+6309171234567', 'PH'],
    ['+819012345678', 'PH'],
    ['09171234567', 'SG'],
    ['+639171234567', 'XX'],
  ])
    assert.equal(normalizePhone(value, country), 'invalid')
  assert.equal(normalizePhone('', 'PH'), '')
  assert.equal(normalizePhone('12025550123', 'US'), '+12025550123')
})
test('existing international callers without country selection remain compatible', () => {
  assert.equal(normalizePhone('+63 (917) 123-4567'), '+639171234567')
  assert.deepEqual(phoneFormValues(''), { phoneCountry: 'PH', phoneNumber: '' })
})
