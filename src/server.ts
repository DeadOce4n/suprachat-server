import { connect, disconnect } from '@/common/loaders/db.ts'
import { IPV6, MONGO_URI, PORT } from '@/utils/const.ts'
import createApp from './app.ts'

const server = await createApp()

await server.ready()

server.listen({ port: PORT, host: '0.0.0.0' }, async (err) => {
  server.log.debug(`\n${server.printRoutes()}`)

  const conn = connect.bind(server)
  await conn(MONGO_URI, { family: IPV6 ? 6 : 4 })

  if (err) {
    server.log.error(err)
    process.emit('SIGTERM')
  }
})

process.on('SIGTERM', async () => {
  await disconnect()
  await server.close()
})
