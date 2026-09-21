import { writeFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'

const encoded = process.env.AMPLIFY_OUTPUTS_GZIP_BASE64
if (!encoded) throw new Error('Set AMPLIFY_OUTPUTS_GZIP_BASE64 in Amplify Hosting before building.')
const outputs = JSON.parse(
  gunzipSync(Buffer.from(encoded, 'base64'), { maxOutputLength: 1048576 }).toString('utf8'),
)
if (!outputs.auth?.user_pool_id || !outputs.auth?.user_pool_client_id || !outputs.data?.url)
  throw new Error('Amplify Hosting client configuration is incomplete.')
writeFileSync('amplify_outputs.json', JSON.stringify(outputs, null, 2) + '\n')
console.log('Restored Amplify client configuration from the Hosting environment.')
