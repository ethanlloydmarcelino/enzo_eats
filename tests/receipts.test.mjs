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

test('editing a flag never changes the receipt completion time', () => {
  const edited = {
    ...order,
    flaggedAt: '2026-09-23T00:00:00Z',
    flagReason: 'Updated note',
    history: [
      ...order.history,
      { type: 'ORDER_FLAG_NOTE_UPDATED', status: 'COMPLETED', at: '2026-09-24T00:00:00Z' },
    ],
  }
  assert.equal(completedAt(edited), completedAt(order))
  assert.match(receiptHtml(edited), /Updated note/)
})

test('flag audit identifies each actor, preserves revisions and safely prints their names', () => {
  const history = [
    ...order.history,
    {
      type: 'ORDER_FLAGGED',
      at: '2026-09-23T01:00:00Z',
      actorId: 'admin-1',
      actorName: 'Alex <Admin>',
      actorRole: 'admin',
      note: 'Original',
    },
    {
      type: 'ORDER_FLAG_NOTE_UPDATED',
      at: '2026-09-23T02:00:00Z',
      actorId: 'admin-2',
      actorName: 'Sam Reviewer',
      actorRole: 'super_admin',
      previousNote: 'Original',
      note: 'Corrected',
    },
  ]
  const audited = {
    ...order,
    flaggedAt: '2026-09-23T01:00:00Z',
    flaggedBy: 'admin-1',
    flagReason: 'Corrected',
    history: JSON.stringify(history),
  }
  const html = receiptHtml(audited, { 'admin-1': 'Changed Name' })
  assert.doesNotMatch(html, /Changed Name/)
  assert.match(html, /Order activity/)
  assert.match(html, /Alex &lt;Admin&gt;/)
  assert.match(html, /Sam Reviewer/)
  assert.doesNotMatch(html, /admin-1|admin-2|Account ID/)
  assert.match(html, /Previous note: Original/)
  assert.match(html, /Note: Corrected/)
  assert.doesNotMatch(html, /<Admin>/)
})

test('legacy flags hide account IDs when names are unavailable', () => {
  const html = receiptHtml({
    ...order,
    flaggedAt: '2026-09-23T00:00:00Z',
    flaggedBy: 'legacy-admin',
    flagReason: 'Current note',
  })
  assert.match(html, /Name unavailable/)
  assert.doesNotMatch(html, /legacy-admin/)
  assert.match(html, /Note: Not recorded/)
})

test('legacy flag names resolve without replacing recorded names', () => {
  const html = receiptHtml(
    { ...order, flaggedAt: order.placedAt, flaggedBy: 'legacy-id' },
    { 'legacy-id': 'Alex Admin' },
  )
  assert.match(html, /Alex Admin/)
  assert.doesNotMatch(html, /legacy-id/)
})

test('unflagged receipts print all recorded steps with actor names and no actor IDs', () => {
  const html = receiptHtml(
    {
      ...order,
      history: [
        { type: 'ORDER_APPROVED', actorId: 'approver-id', at: order.placedAt },
        { type: 'ORDER_PREPARING', actorName: 'Cook Person', at: order.placedAt },
        { type: 'ORDER_READY', actorName: 'Ready Person', at: order.placedAt },
        { type: 'ORDER_COMPLETED', actorName: 'Complete Person', at: order.placedAt },
      ],
    },
    { 'approver-id': 'Approve Person' },
  )
  for (const label of [
    'Order approved',
    'Preparation started',
    'Marked ready',
    'Order completed',
    'Approve Person',
    'Cook Person',
    'Ready Person',
    'Complete Person',
  ])
    assert.ok(html.includes(label))
  assert.doesNotMatch(html, /approver-id/)
})
