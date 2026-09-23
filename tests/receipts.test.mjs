import assert from 'node:assert/strict'
import test from 'node:test'
import { completedAt, receiptDate, receiptHtml } from '../src/orders/receipts.mjs'
const order = {
  id: 'id1',
  orderNumber: 'ENZO-123',
  status: 'COMPLETED',
  currency: 'PHP',
  customerFirstName: '<script>alert(1)</script>',
  customerLastName: 'Customer',
  customerEmail: 'customer@example.test',
  customerPhone: '09123456789',
  customerAddress: 'A & B',
  placedAt: '2026-09-22T00:00:00Z',
  paymentMethod: 'GCASH',
  paymentVerified: true,
  paymentReference: '1234567890123',
  subtotal: 120,
  total: 120,
  lines: [{ name: 'Poppers', option: 'Large', quantity: 2, unitPrice: 60, lineTotal: 120 }],
  history: [
    { status: 'READY', at: '2026-09-22T00:10:00Z' },
    { status: 'COMPLETED', at: '2026-09-22T00:20:00Z' },
  ],
}
test('receipt uses saved item prices, customer and payment details and escapes HTML', () => {
  const html = receiptHtml(order)
  assert.match(html, /Poppers - Large/)
  assert.match(html, /<td>2<\/td>/)
  assert.match(html, /60\.00/)
  assert.match(html, /120\.00/)
  assert.match(html, /1234567890123/)
  assert.match(html, /&lt;script&gt;/)
  assert.doesNotMatch(html, /<script>/)
  assert.match(html, /A &amp; B/)
})
test('completion time comes from durable history in JSON or object format', () => {
  assert.equal(completedAt(order), '2026-09-22T00:20:00Z')
  assert.equal(
    completedAt({ ...order, history: JSON.stringify(order.history) }),
    completedAt(order),
  )
  assert.equal(completedAt({ ...order, history: 'invalid' }), null)
  assert.equal(receiptDate(null), 'Not recorded')
  assert.match(receiptDate(order.placedAt), /8:00/)
})
test('pending, denied and cancelled orders cannot produce completed accounting receipts', () => {
  for (const status of ['AWAITING_APPROVAL', 'DENIED', 'CANCELLED', 'READY'])
    assert.throws(() => receiptHtml({ ...order, status }), /Only completed/)
})

test('flag notes print safely without changing the original completion time', () => {
  const flagged = {
    ...order,
    flaggedAt: '2026-09-23T00:00:00Z',
    flagReason: '<script>bad</script>',
    history: [
      ...order.history,
      { type: 'ORDER_FLAGGED', status: 'COMPLETED', at: '2026-09-23T00:00:00Z' },
    ],
  }
  assert.equal(completedAt(flagged), completedAt(order))
  const html = receiptHtml(flagged)
  assert.match(html, /Flagged for review/)
  assert.match(html, /&lt;script&gt;bad/)
  assert.doesNotMatch(html, /<script>/)
})
