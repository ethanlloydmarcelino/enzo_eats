import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

// npm can omit these nested records while serializing Amplify's bundled tree.
// This exact registry metadata was used by the previously verified lockfile.
const core200 = {
  version: '2.0.0',
  resolved: 'https://registry.npmjs.org/@opentelemetry/core/-/core-2.0.0.tgz',
  integrity:
    'sha512-SLX36allrcnVaPYG3R78F/UZZsBsvbc7lMCLx37LyH5MJ1KAAZ2E3mW9OAD3zGz0G8q/BtoS5VUrjzDydhD6LQ==',
  dev: true,
  inBundle: true,
  license: 'Apache-2.0',
  dependencies: { '@opentelemetry/semantic-conventions': '^1.29.0' },
  engines: { node: '^18.19.0 || >=20.6.0' },
  peerDependencies: { '@opentelemetry/api': '>=1.0.0 <1.10.0' },
}

export function repairAmplifyLock(lock) {
  if (lock.lockfileVersion !== 3 || !lock.packages)
    throw new Error('Expected an npm v3 package-lock.json.')
  const additions = new Map()
  for (const construct of ['data-construct', 'graphql-api-construct']) {
    const root = `node_modules/@aws-amplify/${construct}`
    for (const consumer of ['resources', 'sdk-trace-base']) {
      const parent = `${root}/node_modules/@opentelemetry/${consumer}`
      const entry = lock.packages[parent]
      // Do not impose this workaround on unrelated packages or future versions.
      if (!entry?.inBundle || entry.dependencies?.['@opentelemetry/core'] !== '2.0.0') continue
      const target = `${parent}/node_modules/@opentelemetry/core`
      if (lock.packages[target]) continue
      const inherited =
        lock.packages[`${root}/node_modules/@opentelemetry/core`] ??
        lock.packages['node_modules/@opentelemetry/core']
      if (inherited?.version === '2.0.0') continue
      additions.set(parent, [target, structuredClone(core200)])
    }
  }
  if (additions.size) {
    const packages = {}
    for (const [key, value] of Object.entries(lock.packages)) {
      packages[key] = value
      const addition = additions.get(key)
      if (addition) packages[addition[0]] = addition[1]
    }
    lock.packages = packages
  }
  return additions.size
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const file = resolve('package-lock.json')
  const lock = JSON.parse(readFileSync(file, 'utf8'))
  const count = repairAmplifyLock(lock)
  if (count && process.argv.includes('--check')) {
    console.error(
      `Missing ${count} bundled Amplify lock entries. Run npm run repair:lockfile and commit package-lock.json.`,
    )
    process.exitCode = 1
  } else {
    if (count) writeFileSync(file, JSON.stringify(lock, null, 2) + '\n')
    console.log(
      count
        ? `Restored ${count} bundled Amplify lock entries.`
        : 'Amplify bundled lock entries are complete.',
    )
  }
}
