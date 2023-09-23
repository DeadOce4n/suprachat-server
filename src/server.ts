import { connect, disconnect } from '@/common/loaders/db.ts'
import createApp from './app.ts'
import { env } from '@/utils/env.ts'

const server = await createApp()

await server.ready()

server.listen({ port: env.PORT, host: '0.0.0.0' }, async (err) => {
  server.log.debug(`\n${server.printRoutes()}`)

  const conn = connect.bind(server)
  await conn(env.MONGO_URI, { family: env.IPV6 ? 6 : 4 })

  if (err) {
    server.log.error(err)
    process.emit('SIGTERM')
  }
})

process.on('SIGTERM', async () => {
  await disconnect()
  await server.close()
})
