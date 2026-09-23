import assert from 'node:assert/strict'
import test from 'node:test'
import { receiptSearch } from '../src/orders/receiptSearch.mjs'
test('search restricts the status index and Philippine date range before filtering', () => {
  const result = receiptSearch({
    from: '2026-09-23',
    to: '2026-09-23',
    term: 'ENZO-',
    payment: 'GCASH',
    flagged: 'flagged',
  })
  assert.deepEqual(result.key, {
    status: 'COMPLETED',
    placedAt: { between: ['2026-09-22T16:00:00.000Z', '2026-09-23T15:59:59.999Z'] },
  })
  assert.equal(result.filter.and[0].or[0].orderNumber.contains, 'ENZO-')
  assert.equal(result.filter.and[1].paymentMethod.eq, 'GCASH')
  assert.deepEqual(result.filter.and[2], { flaggedAt: { gt: '' } })
})
test('invalid and reversed dates are rejected before querying', () => {
  for (const dates of [
    { from: '2026-02-30' },
    { to: '23/09/2026' },
    { from: '2026-09-24', to: '2026-09-23' },
  ])
    assert.throws(() => receiptSearch(dates))
  assert.deepEqual(receiptSearch().key, { status: 'COMPLETED' })
  assert.equal(receiptSearch().filter, undefined)
})

test('full-name searches match first and last names across saved fields', () => {
  const { filter } = receiptSearch({ term: 'Jane Doe' })
  assert.equal(filter.and.length, 2)
  assert.equal(filter.and[0].or[2].customerFirstName.contains, 'Jane')
  assert.equal(filter.and[1].or[3].customerLastName.contains, 'Doe')
})
