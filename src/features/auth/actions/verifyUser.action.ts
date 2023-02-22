import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import type { FastifyInstance } from 'fastify'
import { ObjectId } from '@fastify/mongodb'
import type { WithId } from 'mongodb'

import { errorSchema } from '@common/schemas'
import { userWithOidSchema, type User } from '@features/users/module.js'
import IRCClient from '@services/irc.service'
import { ObjectIdString } from '@utils/const'
import { createResponseSchema } from '@utils/func'

const verifyUserSchema = Type.Object(
  {
    userId: ObjectIdString,
    code: Type.String()
  },
  { additionalProperties: false }
)

const responseSchema = createResponseSchema(
  Type.Omit(userWithOidSchema, ['password'])
)

export default async function (fastify: FastifyInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().post(
    '/verify',
    {
      schema: {
        response: {
          200: responseSchema,
          400: errorSchema,
          404: errorSchema,
          500: errorSchema
        },
        body: verifyUserSchema
      }
    },
    async function (request, reply) {
      const { userId, code } = request.body
      const users = this.mongo.db?.collection<User>('users')

      if (!users) {
        return reply.code(500).send({
          success: false,
          errors: [
            {
              name: 'Database unavailable',
              message: 'Database connection error'
            }
          ]
        })
      }

      const user = await users.findOne({ _id: new ObjectId(userId) })

      if (!user) {
        return reply.code(404).send({
          success: false,
          errors: [
            {
              name: 'userNotFound',
              message: `User with _id ${userId} not found`
            }
          ]
        })
      }

      const ircClient = new IRCClient(request.ip, this.log)
      await ircClient.verify({ username: user.nick, code })

      const updatedUser = (await users.findOneAndUpdate(
        { _id: user._id },
        { $set: { verified: true } },
        { returnDocument: 'after' }
      )).value as WithId<User>

      return reply.code(200).send({
        success: true,
        data: {
          ...updatedUser,
          _id: updatedUser._id.toString(),
          registered_date: updatedUser.registered_date.toISOString()
        },
        message: `User ${user.nick} verified successfully`
      })
    }
  )
}
