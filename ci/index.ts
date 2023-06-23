import { connect } from '@dagger.io/dagger'
import k8s from '@kubernetes/client-node'
import { randomUUID } from 'crypto'
import dotenv from 'dotenv'
import fs from 'fs/promises'
import path from 'path'
import YAML from 'yaml'

try {
  const envPath = path.resolve('./ci/.env')
  await fs.access(envPath)
  dotenv.config({ path: envPath })
} catch (e) {
  console.log('Env file not found, skipping...')
}

const include = [
  'src/',
  'package.json',
  'pnpm-lock.yaml',
  '.eslintrc.json',
  '.prettierrc.json',
  'vitest.config.ts',
  'tsconfig.json'
]

const exclude = ['node_modules/', '.pnpm-store/']

connect(
  async (client) => {
    const nodeCache = client.cacheVolume('node')
    const source = client.host().directory('.', {
      include,
      exclude
    })

    // Stage 1: Lint, format, typecheck, test
    const test = client
      .container()
      .from('node:18-bullseye-slim')
      .withMountedDirectory('/home/node/app', source)
      .withMountedCache('/home/node/.pnpm-store', nodeCache)
      .withEnvVariable('SECRET_KEY', 'sacarrácatelas')
      .withExec(['corepack', 'enable'])
      .withExec(['corepack', 'prepare', 'pnpm@latest-8', '--activate'])
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
      .withExec(['apt-get', '-qq', 'update'])
      .withExec(['apt-get', '-qq', 'install', '-y', 'curl'])
      .withExec(['pnpm', 'install', '--frozen-lockfile'])

    const testStdout = await test.stdout()

    console.log(testStdout)

    await Promise.all([
      test.withExec(['pnpm', 'lint:check']).exitCode(),
      test.withExec(['pnpm', 'format:check']).exitCode(),
      test.withExec(['pnpm', 'typecheck']).exitCode(),
      test.withExec(['pnpm', 'coverage']).exitCode()
    ])

    // Stage 2: Build image
    if (process.env.CI_PIPELINE_SOURCE !== 'merge_request_event') {
      console.log('Building and uploading image...')

      const build = test
        .withoutMount('/home/node/app')
        .withDirectory('/home/node/app', test.directory('/home/node/app'))
        .withExec(['pnpm', 'prune', '--prod', '--config.ignore-scripts=true'])
        .withEntrypoint(['pnpm', 'start'])

      const uuid = randomUUID()

      const imageRef = await build.publish(
        `ttl.sh/suprachat-backend-${uuid}:${process.env.IMAGE_EXPIRATION}`
      )

      console.log(`Published image to: ${imageRef}`)

      // Stage 3: Deploy!
      console.log('Deploying to Kubernetes...')

      const kubeConfig = new k8s.KubeConfig()

      kubeConfig.loadFromClusterAndUser(
        {
          name: 'suprachat',
          server: process.env.KUBE_CLUSTER_HOST,
          caData: process.env.KUBE_CA_DATA,
          skipTLSVerify: false
        },
        {
          name: 'suprachat',
          certData: process.env.KUBE_CERT_DATA,
          keyData: process.env.KUBE_KEY_DATA
        }
      )

      const k8sClient = k8s.KubernetesObjectApi.makeApiClient(kubeConfig)

      const manifest = await fs.readFile(
        path.resolve('./infra/deployment.yaml')
      )

      const specs = YAML.parseAllDocuments(manifest.toString('utf8')).map(
        (obj) => obj.toJS()
      ) as k8s.KubernetesObject[]

      const deployment = specs.find(
        (spec) => spec.kind === 'Deployment'
      ) as k8s.KubernetesObject

      deployment['spec']['template']['spec']['containers'][0]['image'] =
        imageRef

      if (deployment.metadata?.annotations) {
        deployment.metadata.annotations[
          'kubectl.kubernetes.io/last-applied-configuration'
        ] = JSON.stringify(deployment)
      }

      try {
        await k8sClient.patch(deployment)
      } catch (e) {
        console.log("Deployment doesn't exist, creating it..")
        await k8sClient.create(deployment)
      }
      console.log('Successfully deployed new image!')
    }
  },
  { LogOutput: process.stdout }
)

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface ProcessEnv {
      KUBE_KEY_DATA: string
      KUBE_CERT_DATA: string
      KUBE_CA_DATA: string
      KUBE_CLUSTER_HOST: string
      IMAGE_EXPIRATION: string
      CI_PIPELINE_SOURCE: string
    }
  }
}
