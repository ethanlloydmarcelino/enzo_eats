import assert from 'node:assert/strict'
import test from 'node:test'
import { repairAmplifyLock } from '../scripts/repair-amplify-lock.mjs'

const makeLock = () => {
  const packages = { '': { name: 'fixture' }, 'node_modules/unrelated': { version: '1.0.0' } }
  for (const name of ['data-construct', 'graphql-api-construct']) {
    const root = `node_modules/@aws-amplify/${name}/node_modules/@opentelemetry`
    packages[`${root}/core`] = { version: '2.8.0' }
    for (const consumer of ['resources', 'sdk-trace-base'])
      packages[`${root}/${consumer}`] = {
        inBundle: true,
        dependencies: { '@opentelemetry/core': '2.0.0' },
      }
  }
  return { lockfileVersion: 3, packages }
}
test('restores missing exact versions without changing unrelated dependencies; repeated runs are stable', () => {
  const lock = makeLock()
  const original = structuredClone(lock.packages)
  assert.equal(repairAmplifyLock(lock), 4)
  for (const [key, value] of Object.entries(original)) assert.deepEqual(lock.packages[key], value)
  const after = JSON.stringify(lock)
  assert.equal(repairAmplifyLock(lock), 0)
  assert.equal(JSON.stringify(lock), after)
})
test('does not add redundant records when a correct version is already inherited', () => {
  const lock = makeLock()
  for (const [key, entry] of Object.entries(lock.packages))
    if (key.endsWith('/core')) entry.version = '2.0.0'
  assert.equal(repairAmplifyLock(lock), 0)
})
test('does not rewrite future dependency versions or non-bundled dependencies', () => {
  const lock = makeLock()
  for (const entry of Object.values(lock.packages))
    if (entry.dependencies) entry.dependencies['@opentelemetry/core'] = '2.8.0'
  assert.equal(repairAmplifyLock(lock), 0)
  const nonBundled = makeLock()
  for (const entry of Object.values(nonBundled.packages)) delete entry.inBundle
  assert.equal(repairAmplifyLock(nonBundled), 0)
})
