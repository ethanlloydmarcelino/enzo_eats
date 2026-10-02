import { checkImage, fitImage } from './images.mjs'

const decode = async (file) => {
  const url = URL.createObjectURL(file)
  try {
    const image = new window.Image()
    image.src = url
    await image.decode()
    return image
  } finally {
    URL.revokeObjectURL(url)
  }
}
let encoderPromise
const fallbackEncoder = () => {
  if (!encoderPromise)
    encoderPromise = import('@jsquash/webp/encode.js')
      .then(async (module) => {
        await module.init(null, { locateFile: (name) => '/codecs/' + name })
        return module.default
      })
      .catch((error) => {
        encoderPromise = null
        throw error
      })
  return encoderPromise
}
const encode = async (canvas, quality) => {
  const native = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
  if (native?.type === 'image/webp') return native
  const encodeWebp = await fallbackEncoder()
  const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height)
  return new Blob([await encodeWebp(pixels, { quality: quality * 100 })], { type: 'image/webp' })
}
export const compressPhoto = async (image, longest, maxBytes) => {
  const canvas = document.createElement('canvas')
  const size = fitImage(
    image.naturalWidth || image.width,
    image.naturalHeight || image.height,
    longest,
  )
  canvas.width = size.width
  canvas.height = size.height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Unable to prepare the photo in this browser.')
  context.imageSmoothingQuality = 'high'
  try {
    for (let attempt = 0; attempt < 5; attempt++) {
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      for (const quality of [0.85, 0.75, 0.65, 0.55, 0.45]) {
        const blob = await encode(canvas, quality)
        if (blob.size <= maxBytes) return { blob, width: canvas.width, height: canvas.height }
      }
      canvas.width = Math.max(1, Math.round(canvas.width * 0.85))
      canvas.height = Math.max(1, Math.round(canvas.height * 0.85))
      context.imageSmoothingQuality = 'high'
    }
    throw new Error('This photo could not be compressed enough. Please choose another photo.')
  } finally {
    canvas.width = 0
    canvas.height = 0
  }
}
export const optimizePhoto = async (file) => {
  const format = checkImage(
    file.type,
    file.size,
    new Uint8Array(await file.slice(0, 64).arrayBuffer()),
  )
  let image
  try {
    image = await decode(file)
  } catch {
    if (format !== 'heic')
      throw new Error('This photo could not be opened. Please choose another image.')
    const { heicTo } = await import('heic-to/csp')
    image = await decode(await heicTo({ blob: file, type: 'image/jpeg', quality: 0.95 }))
  }
  const main = await compressPhoto(image, 1200, 350 * 1024)
  const thumbnail = await compressPhoto(image, 600, 80 * 1024)
  return { main, thumbnail }
}
