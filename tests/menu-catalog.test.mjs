import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
async function setup() {
  const writes = []
  const row = {
    id: '1',
    name: 'Rice',
    price: 60,
    description: 'Rice meal',
    category: 'food',
    visible: true,
    available: true,
    deleted: false,
    updatedAt: 'current',
    imageAssetId: 'photo',
  }
  const client = {
    models: {
      MenuItem: {
        list: async (input) => {
          assert.equal(input.filter.visible.eq, true)
          assert.equal(input.filter.deleted.eq, false)
          return { data: [row], nextToken: 'more' }
        },
        get: async () => ({ data: row }),
        create: async (input) => {
          writes.push(input)
          return { data: input }
        },
      },
      MenuImage: { get: async () => ({ data: { id: 'photo', path: 'menu-images/photo.png' } }) },
    },
    graphql: async (input) => {
      writes.push(input.variables)
      return { data: { updateMenuItem: { id: '1' } } }
    },
  }
  const code = ts.transpileModule(
    fs
      .readFileSync('amplify/functions/menu-catalog/handler.ts', 'utf8')
      .replace(/^import .*$/gm, ''),
    { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } },
  ).outputText
  const handler = await vm.runInNewContext('(async()=>{' + code + ';return exports.handler})()', {
    exports: {},
    randomInt: () => 1001,
    Amplify: { configure() {} },
    generateClient: () => client,
    getAmplifyDataClientConfig: async () => ({}),
    env: {},
    ensureMenuDefaults: async () => {},
    validateMenu: (x) => x,
  })
  return { handler, writes, row }
}
const event = (action, input, role = 'admin') => ({
  arguments: { action, input },
  identity: { sub: 'actor', claims: { sub: 'actor', 'cognito:groups': [role] } },
})
test('public catalog exposes only customer fields and forwards pagination', async () => {
  const { handler } = await setup()
  const result = await handler({ arguments: {} })
  assert.equal(result.nextToken, 'more')
  assert.equal(result.items[0].imagePath, 'menu-images/photo.png')
  assert.equal(result.items[0].updatedAt, undefined)
  assert.equal(result.items[0].id, 1)
})
test('regular users cannot mutate the menu', async () => {
  const { handler, writes } = await setup()
  await assert.rejects(
    handler(event('DELETE', { id: '1', updatedAt: 'current' }, 'user')),
    /NOT_AUTHORIZED/,
  )
  assert.equal(writes.length, 0)
})
test('both admin roles delete by tombstoning with concurrency protection and retaining the image', async () => {
  for (const role of ['admin', 'super_admin']) {
    const { handler, writes } = await setup()
    await handler(event('DELETE', { id: '1', updatedAt: 'current' }, role))
    assert.equal(writes[0].input.deleted, true)
    assert.equal(writes[0].input.visible, false)
    assert.equal(writes[0].input.imageAssetId, undefined)
    assert.equal(writes[0].condition.updatedAt.eq, 'current')
  }
})
test('stale menu edits fail before writing', async () => {
  const { handler, writes } = await setup()
  await assert.rejects(
    handler(event('SAVE', { id: '1', updatedAt: 'old' })),
    /MENU_CHANGED_REFRESH/,
  )
  assert.equal(writes.length, 0)
})
