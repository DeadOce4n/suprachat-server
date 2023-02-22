import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import dayjs from 'dayjs'
import type { FastifyInstance } from 'fastify'

import { errorSchema } from '@common/schemas'
import {
  userSchema,
  userWithOidSchema,
  type User
} from '@features/users/module.js'
import IRCClient from '@services/irc.service.js'
import { createResponseSchema, generatePasswordHash } from '@utils/func.js'
import { Roles } from '@utils/const'

const bodySchema = Type.Omit(userSchema, [
  'registered_date',
  'password_from',
  'role'
])

const responseSchema = createResponseSchema(
  Type.Omit(userWithOidSchema, ['password'])
)

export default async function (fastify: FastifyInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().post(
    '/signup',
    {
      schema: {
        body: bodySchema,
        response: {
          200: responseSchema,
          409: errorSchema,
          500: errorSchema
        }
      }
    },
    async function (request, reply) {
      const {
        body: { nick, password, email }
      } = request
      const users = this.mongo.db?.collection<User>('users')
      if (!users) {
        return reply.code(500).send({
          success: false,
          errors: [
            {
              name: 'databaseUnavailable',
              message: 'Database connection error'
            }
          ]
        })
      }

      const user = await users.findOne({ $or: [{ nick }, { email }] })

      if (user) {
        return reply.code(409).send({
          success: false,
          errors: [
            {
              name: 'duplicateNick',
              message: `${
                user.nick === nick ? `Nick ${nick}` : `Email ${email}`
              } is already in use`
            }
          ]
        })
      }

      const [hasForbiddenChars, forbiddenChars] = IRCClient.verifyNick(nick)
      if (hasForbiddenChars) {
        return reply.code(400).send({
          success: false,
          errors: [
            {
              name: 'invalidNick',
              message: `Nick contains forbidden characters: ${forbiddenChars.join(
                ', '
              )}`
            }
          ]
        })
      }

      const userIp =
        process.env.NODE_ENV === 'production'
          ? request.ips?.at(-1) ?? request.ip
          : request.ip

      const ircClient = new IRCClient(userIp, this.log)

      await ircClient.register({
        username: nick,
        password,
        email
      })

      const newUser: User = {
        ...request.body,
        password: await generatePasswordHash(password),
        registered_date: dayjs().toDate(),
        password_from: 'supra',
        role: Roles.Normal
      }

      const { insertedId } = await users.insertOne(newUser)

      return reply.code(200).send({
        success: true,
        data: {
          ...newUser,
          _id: insertedId.toString(),
          registered_date: newUser.registered_date.toISOString()
        },
        message: 'User registered successfully'
      })
    }
  )
}
