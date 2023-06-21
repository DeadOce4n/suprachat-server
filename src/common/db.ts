import { MongoClient, type MongoClientOptions } from 'mongodb'
import Papr from 'papr'

import { DB_NAME } from '@utils/const.js'

export let client: MongoClient

const papr = new Papr()

export const connect = async (uri: string, options?: MongoClientOptions) => {
  client = await MongoClient.connect(uri, options)

  papr.initialize(client.db(DB_NAME))
  await papr.updateSchemas()
}

export const disconnect = async () => {
  await client.close()
}

export default papr
