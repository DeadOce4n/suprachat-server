import { faker } from '@faker-js/faker'
import dotenv from 'dotenv'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { afterAll, afterEach, describe, expect, test, vi } from 'vitest'

import createApp from '../../../app.js'
import { client, connect } from '../../../common/db.js'
import IRCClient from '../../../services/irc.service.js'
import getDbHelper from '../../../test/utils/db.js'

dotenv.config()

describe('test auth module actions', async () => {
  const mongod = await MongoMemoryServer.create()
  const app = createApp()
  await app.ready()

  await connect(mongod.getUri())
  await app.ready()
  const dbHelper = getDbHelper(client, mongod)

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
