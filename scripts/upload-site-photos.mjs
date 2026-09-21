import fs from 'node:fs'
import path from 'node:path'
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'

const outputs = JSON.parse(fs.readFileSync('amplify_outputs.json', 'utf8'))
if (!outputs.storage?.bucket_name) throw new Error('Deploy Amplify Storage first.')
const client = new S3Client({ region: outputs.storage.aws_region })
const directories = ['assets/images', 'public/images']
const photos = new Map()
for (const directory of directories)
  for (const file of fs.readdirSync(directory)) {
    if (/\.(png|jpg|jpeg|webp)$/i.test(file)) photos.set(file, path.join(directory, file))
  }
for (const [name, file] of photos) {
  const Key = `site/${name}`
  const Body = fs.readFileSync(file)
  const ContentType = /\.png$/i.test(name)
    ? 'image/png'
    : /\.webp$/i.test(name)
      ? 'image/webp'
      : 'image/jpeg'
  await client.send(
    new PutObjectCommand({
      Bucket: outputs.storage.bucket_name,
      Key,
      Body,
      ContentType,
      CacheControl: 'public, max-age=3600',
    }),
  )
  const result = await client.send(
    new HeadObjectCommand({ Bucket: outputs.storage.bucket_name, Key }),
  )
  if (result.ContentLength !== Body.length) throw new Error(`Upload verification failed: ${name}`)
  console.log(`Uploaded and verified ${Key}`)
}
