import assert from 'node:assert/strict'
import { test } from 'node:test'
import { priceOrder, transitionAllowed } from '../amplify/functions/shared/checkout'
import { GCASH_NUMBER } from '../src/checkout/rules'

test('server reprices a forged cart and rejects invalid quantities and options', () => {
  const line = { menuId: 2, quantity: 3, unitPrice: 1, name: 'Fake item' }
  assert.equal(priceOrder([line], 'CASH')[0].lineTotal, 210)
  assert.equal(priceOrder([line], 'CASH')[0].name, 'Chicken Tocino')
  for (const quantity of [0, -1, 1.5, 51, NaN])
    assert.throws(() => priceOrder([{ ...line, quantity }], 'CASH'), /INVALID_QUANTITY/)
  assert.throws(() => priceOrder([{ menuId: 999, quantity: 1 }], 'CASH'), /UNKNOWN_ITEM/)
  assert.throws(
    () => priceOrder([{ menuId: 5, quantity: 1, option: 'invented' }], 'CASH'),
    /INVALID_OPTION/,
  )
  assert.equal(
    priceOrder([{ menuId: 5, quantity: 1, option: 'green-apple' }], 'CASH')[0].option,
    'Green Apple',
  )
})

test('GCash requires a reference and unsupported payment methods remain blocked', () => {
  const lines = [{ menuId: 2, quantity: 10 }]
  assert.equal(GCASH_NUMBER, '0916-408-2529')
  assert.throws(() => priceOrder(lines, 'GCASH'), /GCASH_REFERENCE_INVALID/)
  assert.throws(() => priceOrder(lines, 'GCASH', 'abc123'), /GCASH_REFERENCE_INVALID/)
  assert.equal(priceOrder(lines, 'GCASH', '1234 5678 90123').length, 1)
  assert.throws(() => priceOrder(lines, 'PAYPAL'), /PAYPAL_NOT_AVAILABLE/)
  assert.throws(() => priceOrder(lines, 'INVENTED'), /INVALID_PAYMENT_METHOD/)
})

test('order lifecycle does not skip approval or overturn terminal decisions', () => {
  assert.equal(transitionAllowed('AWAITING_APPROVAL', 'APPROVED'), true)
  assert.equal(transitionAllowed('AWAITING_APPROVAL', 'DENIED'), true)
  assert.equal(transitionAllowed('AWAITING_APPROVAL', 'COMPLETED'), false)
  assert.equal(transitionAllowed('DENIED', 'APPROVED'), false)
  assert.equal(transitionAllowed('APPROVED', 'DENIED'), false)
  assert.equal(transitionAllowed('APPROVED', 'PREPARING'), true)
  assert.equal(transitionAllowed('PREPARING', 'READY'), true)
  assert.equal(transitionAllowed('READY', 'COMPLETED'), true)
  assert.equal(transitionAllowed('COMPLETED', 'READY'), false)
})
