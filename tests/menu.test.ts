import assert from 'node:assert/strict'
import test from 'node:test'
import { validateMenu } from '../amplify/functions/menu-catalog/validation'
import { ensureMenuDefaults } from '../amplify/functions/menu-catalog/seed'
import { priceOrder } from '../amplify/functions/shared/checkout'
import { checkImage } from '../src/menu/images.mjs'
const valid = {
  name: 'Rice',
  description: '',
  price: 60,
  category: 'food',
  visible: true,
  available: true,
}
test('menu validates money, visibility and unique options', () => {
  assert.equal(validateMenu(valid).name, 'Rice')
  for (const price of [-1, 0, NaN, Infinity, 1.001])
    assert.throws(() => validateMenu({ ...valid, price }), /INVALID_PRICE/)
  assert.throws(() => validateMenu({ ...valid, name: ' ' }), /INVALID_NAME/)
  assert.throws(() => validateMenu({ ...valid, visible: 'false' }), /INVALID_VISIBILITY/)
  assert.throws(
    () => validateMenu({ ...valid, options: ['Green Apple', 'green-apple'] }),
    /DUPLICATE_OPTIONS/,
  )
})
test('checkout uses current catalog and rejects stale, hidden, unavailable or deleted entries', () => {
  const line = { menuId: 1001, unitPrice: 60, quantity: 2 }
  const catalog = { 1001: valid }
  assert.equal(priceOrder([line], 'CASH', '', catalog)[0].lineTotal, 120)
  assert.throws(
    () => priceOrder([{ ...line, unitPrice: 1 }], 'CASH', '', catalog),
    /MENU_PRICE_CHANGED/,
  )
  for (const change of [{ visible: false }, { available: false }, { deleted: true }])
    assert.throws(
      () => priceOrder([line], 'CASH', '', { 1001: { ...valid, ...change } }),
      /ITEM_UNAVAILABLE/,
    )
  assert.throws(() => priceOrder([line], 'CASH', '', {}), /UNKNOWN_ITEM/)
})
test('default initialization preserves edits, deleted items and photo library across retries', async () => {
  const items = new Map<string, any>([
    ['1', { id: '1', deleted: true }],
    ['2', { id: '2', price: 999 }],
  ])
  const images = new Map<string, any>()
  const model = (map: Map<string, any>) => ({
    get: async ({ id }: any) => ({ data: map.get(id) }),
    create: async (item: any) => {
      assert.equal(map.has(item.id), false)
      map.set(item.id, item)
      return { data: item }
    },
  })
  const models = { MenuItem: model(items), MenuImage: model(images) }
  await ensureMenuDefaults(models)
  await ensureMenuDefaults(models)
  assert.equal(items.size, 5)
  assert.equal(images.size, 5)
  assert.equal(items.get('1').deleted, true)
  assert.equal(items.get('2').price, 999)
})
test('image uploads reject mislabeled files and oversized files', () => {
  assert.equal(checkImage('image/jpeg', 100, new Uint8Array([255, 216, 255])), 'jpg')
  assert.throws(() => checkImage('image/jpeg', 100, new Uint8Array([60, 115, 118, 103])))
  assert.throws(() => checkImage('image/svg+xml', 100, new Uint8Array([60, 115, 118, 103])))
  assert.throws(() => checkImage('image/jpeg', 11000000, new Uint8Array([255, 216, 255])))
})
