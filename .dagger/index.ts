import { connect } from '@dagger.io/dagger'
import path from 'path'
import { randomUUID } from 'crypto'

const include = [
  'src/',
  'package.json',
  'pnpm-lock.yaml',
  '.eslintrc.json',
  '.prettierrc.json',
  'vitest.config.ts',
  'tsconfig.json'
]

connect(
  async (client) => {
    const nodeCache = client.cacheVolume('node')
    const source = client.host().directory(path.resolve('.'), {
      include
    })

    const test = client
      .container()
      .from('node:18-slim')
      .withMountedDirectory('/home/node/app', source)
      .withMountedCache('/home/node/.pnpm-store', nodeCache)
      .withEnvVariable('SECRET_KEY', 'sacarrácatelas')
      .withExec(['corepack', 'enable'])
      .withExec([
        'pnpm',
        'config',
        'set',
        'store-dir',
        '/home/node/.pnpm-store'
      ])
      .withExec(['chown', '-R', 'node:node', '/home/node/.pnpm-store'])
      .withExec(['chown', '-R', 'node:node', '/home/node/app'])
      .withWorkdir('/home/node/app')
      .withExec(['apt-get', 'update'])
      .withExec(['apt-get', 'install', '-y', 'curl'])
      .withExec(['pnpm', 'install', '--frozen-lockfile'])

    await test.withExec(['pnpm', 'type-check']).exitCode()
    await test.withExec(['pnpm', 'coverage']).exitCode()

    if (process.env.CI_PIPELINE_SOURCE !== 'merge_request_event') {
      const build = client
        .container()
        .from('node:18-slim')
        .withDirectory(
          '/home/node/app',
          client.host().directory(path.resolve('.')),
          { include }
        )
        .withExec(['chown', '-R', 'node:node', '/home/node/app'])
        .withExec(['apt-get', 'update'])
        .withExec(['apt-get', 'install', '-y', 'curl'])
        .withExec(['corepack', 'enable'])
        .withExec([
          'pnpm',
          'config',
          'set',
          'store-dir',
          '/home/node/.pnpm-store'
        ])
        .withExec(['mkdir', '/home/node/.pnpm-store'])
        .withExec(['chown', '-R', 'node:node', '/home/node/.pnpm-store'])
        .withMountedCache('/home/node/.pnpm-store', nodeCache)
        .withWorkdir('/home/node/app')
        .withExec(['pnpm', 'install', '--prod', '--frozen-lockfile'])
        .withEntrypoint(['pnpm', 'start'])

      const uuid = randomUUID()

      const imageRef = await build.publish(
        `ttl.sh/suprachat-backend-${uuid}:${process.env.IMAGE_EXPIRATION}`
      )

      console.log(`Published image to: ${imageRef}`)
    }
  },
  { LogOutput: process.stdout }
)
