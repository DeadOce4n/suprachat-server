import type { FastifyInstance } from 'fastify'
import type { MongoMemoryServer } from 'mongodb-memory-server'

type MongoClient = FastifyInstance['mongo']['client']

const getDbHelper = (client: MongoClient, mongod: MongoMemoryServer) => ({
  client,
  mongod,
  clearDatabase: async () => {
    const collections = await client.db().listCollections().toArray()
    await Promise.all(
      collections.map(async (collection) =>
        client.db().dropCollection(collection.name)
      )
    )
  },
  closeDatabase: async () => {
    await client.close()
    await mongod.stop()
  }
})

export default getDbHelper
