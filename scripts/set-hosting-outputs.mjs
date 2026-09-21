import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { AmplifyClient, GetAppCommand, UpdateAppCommand } from '@aws-sdk/client-amplify'

const [appId, region] = process.argv.slice(2)
if (!appId || !region)
  throw new Error('Usage: node scripts/set-hosting-outputs.mjs <app-id> <region>')
const outputs = JSON.parse(readFileSync('amplify_outputs.json', 'utf8'))
if (!outputs.auth?.user_pool_id || !outputs.data?.url)
  throw new Error('Generate valid Amplify outputs first.')
const value = gzipSync(JSON.stringify(outputs)).toString('base64')
if (value.length > 5500)
  throw new Error('Configuration exceeds the Hosting environment-variable limit.')
const client = new AmplifyClient({ region })
const { app } = await client.send(new GetAppCommand({ appId }))
await client.send(
  new UpdateAppCommand({
    appId,
    environmentVariables: {
      ...app.environmentVariables,
      AMPLIFY_OUTPUTS_GZIP_BASE64: value,
    },
  }),
)
console.log('Updated Hosting client configuration. Other environment variables were preserved.')
