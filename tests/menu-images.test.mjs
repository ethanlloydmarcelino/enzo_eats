import assert from 'node:assert/strict'
import test from 'node:test'
import { checkImage, fitImage, thumbnailPath, MAX_UPLOAD_BYTES } from '../src/menu/images.mjs'
test('accepts up to 10 MB, including HEIC with an empty browser MIME type', () => {
  assert.equal(checkImage('', MAX_UPLOAD_BYTES, new Uint8Array([255, 216, 255])), 'jpg')
  assert.throws(() =>
    checkImage('image/jpeg', MAX_UPLOAD_BYTES + 1, new Uint8Array([255, 216, 255])),
  )
  const bytes = new Uint8Array(24)
  bytes.set(new TextEncoder().encode('ftypheic'), 4)
  assert.equal(checkImage('', 3000, bytes), 'heic')
  assert.throws(() => checkImage('image/heic', 3000, new Uint8Array(24)))
})
test('resizing preserves portrait, landscape and square proportions without enlarging', () => {
  assert.deepEqual(fitImage(4000, 3000, 1200), { width: 1200, height: 900 })
  assert.deepEqual(fitImage(3000, 4000, 1200), { width: 900, height: 1200 })
  assert.deepEqual(fitImage(3000, 3000, 600), { width: 600, height: 600 })
  assert.deepEqual(fitImage(200, 100, 1200), { width: 200, height: 100 })
  assert.throws(() => fitImage(0, 0, 1200))
})
test('thumbnail paths only change newly optimized photos', () => {
  assert.equal(
    thumbnailPath('menu-images/optimized/id/main.webp'),
    'menu-images/optimized/id/thumb.webp',
  )
  assert.equal(thumbnailPath('menu-images/old.jpg'), 'menu-images/old.jpg')
})
