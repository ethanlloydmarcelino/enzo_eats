import { mkdirSync, copyFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
const require = createRequire(import.meta.url)
const directory = new URL('../public/codecs/', import.meta.url)
mkdirSync(directory, { recursive: true })
for (const name of ['webp_enc.wasm', 'webp_enc_simd.wasm']) {
  copyFileSync(
    require.resolve('@jsquash/webp/codec/enc/' + name),
    fileURLToPath(new URL(name, directory)),
  )
}
console.log('Prepared browser WebP codecs.')
