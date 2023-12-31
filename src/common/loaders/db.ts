import type { FastifyInstance } from 'fastify'
import { MongoClient, type MongoClientOptions } from 'mongodb'
import Papr from 'papr'

import { env } from '@/utils/env.ts'

export let client: MongoClient

const papr = new Papr()

export async function connect(
  this: FastifyInstance,
  uri: string,
  options?: MongoClientOptions
) {
  client = await MongoClient.connect(uri, options)

  papr.initialize(client.db(env.DB_NAME))
  await papr.updateSchemas()

  !!this && this.log.debug(`Papr connected!`)
}

export const disconnect = async () => {
  await client.close()
}

export default papr
