import { connect, type default as Client } from '@dagger.io/dagger'
import { simpleGit } from 'simple-git'
import { readFile, writeFile } from 'node:fs/promises'
import { rmSync } from 'node:fs'
import { promisify } from 'node:util'
import { exec as cbExec } from 'node:child_process'
import { randomUUID } from 'node:crypto'

const exec = promisify(cbExec)

export const ircdPipeline = async (client: Client) => {
  const REMOTE = 'https://github.com/ergochat/ergo.git'
  const TARGET = './ergo'

  const git = simpleGit()

  await git.clone(REMOTE, TARGET)
  await git.cwd({ path: TARGET, root: true })
  await git.fetch(['--all'])
  await git.checkout('v2.11.1')

  const dockerfile = (await readFile('./ergo/Dockerfile')).toString()

  const newDockerfile = dockerfile
    .replace('# RUN apk add --no-cache bash', 'RUN apk add --no-cache bash')
    .replace('# RUN apk add --no-cache vim', 'RUN apk add --no-cache vim')
    .replace('# CMD /bin/bash', 'CMD /bin/bash')
    .replace('ENTRYPOINT ["/ircd-bin/run.sh"]', '')

  await writeFile('./ergo/Dockerfile', newDockerfile, 'utf8')

  const { stdout: buildOutput, stderr: buildErr } = await exec(
    'docker build -t ergo-debug ./ergo'
  )

  console.log(buildOutput)
  console.log(buildErr)

  rmSync('./ergo', { recursive: true, force: true })

  const { stdout: tarOutput, stderr: tarErr } = await exec(
    'docker save -o ergo-debug.tar ergo-debug'
  )

  console.log(tarOutput)
  console.log(tarErr)

  const fileuploaderBuild = client
    .container()
    .from('golang:1.20.4-alpine')
    .withWorkdir('/usr/src/app')
    .withExec(['apk', 'update'])
    .withExec(['apk', 'add', 'git', 'make'])
    .withExec(['git', 'clone', 'https://github.com/ergochat/ergo-dnsbl.git'])
    .withWorkdir('/usr/src/app/ergo-dnsbl')
    .withExec(['go', 'mod', 'download'])
    .withExec(['make'])

  console.log(await fileuploaderBuild.stdout())

  const container = client
    .container()
    .import(client.host().file('ergo-debug.tar'))
    .withExec(['apk', 'update'])
    .withExec(['apk', 'add', 'python3', 'py3-pip'])
    .withExec(['pip3', 'install', '--upgrade', 'wheel', 'setuptools'])
    .withExec(['pip3', 'install', 'python-dotenv', 'pymongo', 'Werkzeug'])
    .withFile('/ircd-bin/auth.py', client.host().file('./tools/auth.py'))
    .withFile('/ircd-bin/dnsbl.yaml', client.host().file('./tools/dnsbl.yaml'))
    .withFile(
      '/ircd-bin/oragono-dnsbl',
      fileuploaderBuild.file('/usr/src/app/ergo-dnsbl/oragono-dnsbl')
    )
    .withExec(['chmod', '+x', '/ircd-bin/auth.py'])
    .withExec(['chmod', '+x', '/ircd-bin/oragono-dnsbl'])
    .withEntrypoint(['/ircd-bin/run.sh'])

  console.log(await container.stdout())

  const imageRef = await container.publish(
    `ttl.sh/suprachat-ergo-${randomUUID()}:10m`
  )

  console.log(`Published image to ${imageRef}`)
}

connect(ircdPipeline, { LogOutput: process.stdout })
