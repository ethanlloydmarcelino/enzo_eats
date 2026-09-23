import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
const compile = (path) =>
  ts.transpileModule(fs.readFileSync(path, 'utf8').replace(/^import .*$/gm, ''), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText
const rules = { exports: {} }
vm.runInNewContext(compile('amplify/functions/shared/checkout.ts'), rules)
async function setup(status, extra = {}) {
  const existing = {
    id: 'order',
    owner: 'customer',
    status,
    paymentMethod: 'GCASH',
    paymentVerified: true,
    updatedAt: '2026-09-23T00:00:00Z',
    history: JSON.stringify([
      { type: 'ORDER_COMPLETED', status: 'COMPLETED', at: '2026-09-22T00:00:00Z' },
    ]),
    ...extra,
  }
  const writes = []
  const client = {
    models: {
      Order: { get: async () => ({ data: existing }) },
      OrderEvent: {
        create: async (x) => {
          writes.push(x)
          return {}
        },
      },
    },
    graphql: async (x) => {
      writes.push(x.variables)
      return { data: { updateOrder: { ...existing, ...x.variables.input } } }
    },
  }
  const handler = await vm.runInNewContext(
    '(async()=>{' +
      compile('amplify/functions/review-order/handler.ts') +
      ';return exports.handler})()',
    {
      exports: {},
      Amplify: { configure: () => {} },
      generateClient: () => client,
      getAmplifyDataClientConfig: async () => ({}),
      env: {},
      transitionAllowed: rules.exports.transitionAllowed,
      orderSelection: 'id',
      console,
    },
  )
  const run = (args, group = 'admin') =>
    handler({
      identity: { claims: { sub: 'admin-id', 'cognito:groups': [group] } },
      arguments: { orderId: 'order', ...args },
    })
  return { run, writes }
}
test('admins cancel active orders with an audit reason, preserving payment state', async () => {
  for (const status of ['AWAITING_APPROVAL', 'APPROVED', 'PREPARING', 'READY']) {
    const { run, writes } = await setup(status)
    const result = await run({ status: 'CANCELLED', decisionNote: 'Sold out' })
    assert.equal(result.status, 'CANCELLED')
    assert.equal(result.paymentVerified, true)
    assert.equal(JSON.parse(result.history).at(-1).note, 'Sold out')
    assert.equal(writes[0].condition.updatedAt.eq, '2026-09-23T00:00:00Z')
  }
})
test('rejects missing cancellation reason, terminal cancellation and regular users', async () => {
  await assert.rejects(
    (await setup('PREPARING')).run({ status: 'CANCELLED', decisionNote: ' ' }),
    /CANCELLATION_REASON_REQUIRED/,
  )
  for (const status of ['COMPLETED', 'DENIED', 'CANCELLED'])
    await assert.rejects(
      (await setup(status)).run({ status: 'CANCELLED', decisionNote: 'Reason' }),
      /ORDER_ALREADY_DECIDED/,
    )
  const { run, writes } = await setup('PREPARING')
  await assert.rejects(
    run({ status: 'CANCELLED', decisionNote: 'Reason' }, 'user'),
    /NOT_AUTHORIZED/,
  )
  assert.equal(writes.length, 0)
})
test('both admin roles can flag completed orders without altering their payment or status', async () => {
  for (const group of ['admin', 'super_admin']) {
    const { run } = await setup('COMPLETED')
    const result = await run({ flagReason: ' Receipt mismatch ' }, group)
    assert.equal(result.status, 'COMPLETED')
    assert.equal(result.paymentVerified, true)
    assert.equal(result.flagReason, 'Receipt mismatch')
    assert.equal(result.flaggedBy, 'admin-id')
    assert.equal(JSON.parse(result.history).at(-1).type, 'ORDER_FLAGGED')
  }
})
test('flags require a completed order and a nonempty bounded reason', async () => {
  for (const flagReason of ['', ' ', 'a'.repeat(501)])
    await assert.rejects((await setup('COMPLETED')).run({ flagReason }), /FLAG_REASON_REQUIRED/)
  await assert.rejects((await setup('READY')).run({ flagReason: 'Reason' }), /ONLY_COMPLETED/)
  await assert.rejects(
    (await setup('COMPLETED', { flaggedAt: '2026-09-22' })).run({ flagReason: 'Reason' }),
    /ALREADY_FLAGGED/,
  )
  await assert.rejects(
    (await setup('COMPLETED')).run({ flagReason: 'Reason' }, 'user'),
    /NOT_AUTHORIZED/,
  )
})
