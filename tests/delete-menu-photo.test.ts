import assert from 'node:assert/strict'
import test from 'node:test'
import { deleteMenuPhoto } from '../amplify/functions/menu-catalog/delete-photo'
const setup = (
  asset: any = { id: 'photo', path: 'menu-images/optimized/photo/main.webp' },
  pages: any[] = [{ data: [] }],
) => {
  const calls: any[] = []
  const models = {
    MenuImage: {
      get: async () => ({ data: asset }),
      update: async (input: any) => {
        calls.push(input)
        return { data: input }
      },
    },
    MenuItem: { list: async () => pages.shift() },
  }
  return {
    models,
    calls,
    remove: async (keys: string[]) => {
      calls.push(keys)
    },
  }
}
test('admin, user and guests cannot delete photos', async () => {
  for (const groups of [['admin'], ['user'], []]) {
    const s = setup()
    await assert.rejects(deleteMenuPhoto(s.models, groups, 'photo', s.remove), /NOT_AUTHORIZED/)
    assert.equal(s.calls.length, 0)
  }
})
test('super admin deletes main and thumbnail, then retains a deleted library record', async () => {
  const s = setup()
  await deleteMenuPhoto(s.models, ['super_admin'], 'photo', s.remove)
  assert.deepEqual(s.calls, [
    ['menu-images/optimized/photo/main.webp', 'menu-images/optimized/photo/thumb.webp'],
    { id: 'photo', deleted: true },
  ])
})
test('reference checks paginate and block photos used by any active menu item', async () => {
  const s = setup(undefined, [{ data: [], nextToken: 'more' }, { data: [{ id: 'hidden-item' }] }])
  await assert.rejects(
    deleteMenuPhoto(s.models, ['super_admin'], 'photo', s.remove),
    /PHOTO_IN_USE/,
  )
  assert.equal(s.calls.length, 0)
})
test('S3 failure preserves library metadata so deletion can be retried', async () => {
  const s = setup()
  await assert.rejects(
    deleteMenuPhoto(s.models, ['super_admin'], 'photo', async () => {
      throw new Error('S3 failure')
    }),
    /S3 failure/,
  )
  assert.equal(s.calls.length, 0)
})
test('bundled photos stay deleted and repeated deletion is idempotent', async () => {
  const s = setup({ id: 'bundled-1', bundledId: 1 })
  await deleteMenuPhoto(s.models, ['super_admin'], 'bundled-1', s.remove)
  assert.deepEqual(s.calls, [{ id: 'bundled-1', deleted: true }])
  const gone = setup({ deleted: true })
  await deleteMenuPhoto(gone.models, ['super_admin'], 'photo', gone.remove)
  assert.equal(gone.calls.length, 0)
})
test('metadata cannot redirect deletion to another photo or arbitrary bucket path', async () => {
  const s = setup({ id: 'photo', path: 'menu-images/another-photo.jpg' })
  await assert.rejects(
    deleteMenuPhoto(s.models, ['super_admin'], 'photo', s.remove),
    /INVALID_IMAGE_PATH/,
  )
  assert.equal(s.calls.length, 0)
})
