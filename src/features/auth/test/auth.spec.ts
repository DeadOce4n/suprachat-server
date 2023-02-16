import mongodb from '@fastify/mongodb'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { afterAll, afterEach, describe, expect, test, vi } from 'vitest'
import { faker } from '@faker-js/faker'

import createApp from '../../../app.js'
import getDbHelper from '../../../test/utils/db.js'
import IRCClient from '../../../services/irc.service.js'
import dotenv from 'dotenv'

dotenv.config()

describe('test auth module actions', async () => {
  const mongod = await MongoMemoryServer.create()
  const app = createApp().register(mongodb, {
    url: `${mongod.getUri()}suprachat`
  })

  await app.ready()

  const dbHelper = getDbHelper(app.mongo.client, mongod)

  afterEach(async () => dbHelper.clearDatabase())
  afterAll(async () => {
    await dbHelper.closeDatabase()
    await app.close()
  })

  test('user registration', async () => {
    const registerMock = vi.fn(async () => void null)
    vi.spyOn(IRCClient.prototype, 'register').mockImplementationOnce(
      registerMock
    )

    const payload = {
      nick: faker.name.firstName(),
      email: faker.internet.email(),
      password: faker.internet.password()
    }

    const response = await app.inject({
      method: 'POST',
      url: '/auth/signup',
      payload
    })

    const data = await response.json()

    expect(data.success).toBe(true)
  })
})
