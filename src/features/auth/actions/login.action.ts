import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import dayjs from 'dayjs'
import type { FastifyInstance } from 'fastify'
import { omit } from 'remeda'

import { errorSchema } from '@common/schemas.js'
import type { User } from '@features/users/module.js'
import {
  checkPasswordHash,
  checkPasswordHashErgo,
  createResponseSchema,
  generatePasswordHash
} from '@utils/func.js'

const bodySchema = Type.Object({
  remember_me: Type.Boolean()
})

const responseSchema = createResponseSchema(
  Type.Object(
    {
      token: Type.String()
    },
    { additionalProperties: false }
  )
)

export default async function (fastify: FastifyInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().post(
    '/login',
    {
      schema: {
        body: bodySchema,
        response: {
          200: responseSchema,
          400: errorSchema,
          404: errorSchema,
          409: errorSchema
        }
      }
    },
    async function (request, reply) {
      if (!request.headers.authorization) {
        return reply.code(400).send({
          success: false,
          error: {
            name: 'missingAuthorizationHeader',
            message: 'Authorization header is missing'
          }
        })
      }
      const [, headerToken] = request.headers.authorization.split(' ')
      if (!headerToken) {
        return reply.code(400).send({
          success: false,
          error: {
            name: 'malformedAuthorization',
            message: 'Authorization header is malformed'
          }
        })
      }
      const auth = Buffer.from(headerToken, 'base64').toString('utf8')
      const [username, password] = auth.split(':')

      if (!username || !password) {
        return reply.code(400).send({
          success: false,
          error: {
            name: 'malformedAuthorization',
            message: 'Authorization header is malformed'
          }
        })
      }

      const collection = this.mongo.db?.collection<User>('users')

      if (!collection) {
        return reply.code(500).send({
          success: false,
          error: {
            name: 'databaseUnavailable',
            message: 'Database connection error'
          }
        })
      }

      const user = await collection.findOne({
        $or: [{ nick: username }, { email: username }]
      })

      if (!user) {
        return reply.code(404).send({
          success: false,
          error: { name: 'userNotFound', message: 'User not found' }
        })
      }

      let checkPasswdHashFunc: typeof checkPasswordHash

      if (user.password_from === 'ergo') {
        this.log.info(
          `Account ${user.nick} was created directly in the chat, gotta migrate it...`
        )
        checkPasswdHashFunc = checkPasswordHashErgo
      } else {
        checkPasswdHashFunc = checkPasswordHash
      }

      if (!(await checkPasswdHashFunc(user.password, password))) {
        return reply.code(409).send({
          success: false,
          error: {
            name: 'wrongPassword',
            message: 'Provided password is incorrect'
          }
        })
      }

      if (user.password_from === 'ergo') {
        await collection.updateOne(
          { _id: user._id },
          {
            $set: {
              password_from: 'supra',
              password: await generatePasswordHash(password)
            }
          }
        )
      }
      const now = dayjs()
      const expiration = now
        .clone()
        .add(30, request.body.remember_me ? 'days' : 'minutes')

      const token = this.jwt.sign(omit(user, ['password']), {
        expiresIn: expiration.diff(now).toString()
      })

      this.log.info(
        `User ${user.nick} - ${user.email} logs in | Extended session: ${
          request.body.remember_me ?? false
        }`
      )

      return reply.code(200).send({
        success: true,
        data: {
          token
        },
        message: 'User logged in successfully',
        messageKey: 'loginSuccessful'
      })
    }
  )
}
