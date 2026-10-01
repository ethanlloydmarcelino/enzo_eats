import assert from 'node:assert/strict'
import test from 'node:test'
import { orderProgress } from '../src/orders/progress.mjs'
test('stepper represents new and legacy order stages', () => {
  for (const [status, stage] of [
    ['AWAITING_APPROVAL', 0],
    ['APPROVED', 1],
    ['PREPARING', 1],
    ['READY', 2],
    ['COMPLETED', 3],
  ])
    assert.deepEqual(orderProgress({ status }), { stage, stopped: false })
})
test('stopped progress retains the stage where cancellation or denial occurred', () => {
  assert.deepEqual(
    orderProgress({ status: 'DENIED', history: [{ status: 'DENIED', from: 'PREPARING' }] }),
    { stage: 1, stopped: true },
  )
  assert.deepEqual(orderProgress({ status: 'CANCELLED', completedAt: '2026-10-01' }), {
    stage: 3,
    stopped: true,
  })
})
