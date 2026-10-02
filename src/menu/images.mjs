export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
export const checkImage = (type, size, bytes) => {
  if (!size || size > MAX_UPLOAD_BYTES) throw new Error('Choose a photo up to 10 MB.')
  const ascii = (start, end) => String.fromCharCode(...bytes.slice(start, end))
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'jpg'
  if (bytes.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10') return 'png'
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp'
  if (ascii(4, 8) === 'ftyp') {
    for (let i = 8; i + 4 <= bytes.length; i += 4) {
      if (['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'].includes(ascii(i, i + 4))) return 'heic'
    }
  }
  throw new Error('Choose a JPG, PNG, HEIC, or WebP photo.')
}
export const fitImage = (width, height, longest) => {
  if (!(width > 0 && height > 0)) throw new Error('This photo has invalid dimensions.')
  const scale = Math.min(1, longest / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}
// Only our new upload layout has a thumbnail. Old library photos remain compatible.
export const thumbnailPath = (path) =>
  path?.startsWith('menu-images/optimized/') && path.endsWith('/main.webp')
    ? path.replace(/main\.webp$/, 'thumb.webp')
    : path
