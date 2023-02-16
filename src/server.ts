import mongodb from '@fastify/mongodb'

import createApp from './app.js'
import { MONGO_URI, DB_NAME, PORT } from '@utils/const.js'

process.on('SIGTERM', () => process.exit(1))

const server = createApp()

server.log.debug(MONGO_URI)

server.register(mongodb, {
  forceClose: true,
  url: MONGO_URI,
  database: DB_NAME,
  family: 4
})

await server.ready()

server.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  server.log.debug(`\n${server.printRoutes()}`)
  if (err) {
    server.log.error(err)
    process.emit('SIGTERM')
  }
})
