export const checkImage = (type, size, bytes) => {
  if (!size || size > 5 * 1024 * 1024) throw new Error('Choose a photo smaller than 5 MB.')
  const ascii = (start, end) => String.fromCharCode(...bytes.slice(start, end))
  const valid =
    (type === 'image/jpeg' && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) ||
    (type === 'image/png' && bytes.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10') ||
    (type === 'image/webp' && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP')
  if (!valid) throw new Error('Choose a JPEG, PNG, or WebP photo.')
  return { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[type]
}
