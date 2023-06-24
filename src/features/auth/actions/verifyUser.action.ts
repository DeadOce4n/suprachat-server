import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import type { FastifyInstance } from 'fastify'
import { ObjectId } from 'mongodb'

import { defaultHeadersSchema, errorSchema } from '@common/schemas.js'
import { UserDocument, UserModel, userSchema } from '@features/users/module.js'
import IRCClient from '@services/irc.service.js'
import { ObjectIdString } from '@utils/const.js'
import { createResponseSchema } from '@utils/func.js'

const verifyUserSchema = Type.Object(
  {
    userId: ObjectIdString,
    code: Type.String()
  },
  { additionalProperties: false }
)

const responseSchema = createResponseSchema(Type.Omit(userSchema, ['password']))

export default async function (fastify: FastifyInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().put(
    '/verify',
    {
      schema: {
        description:
          'Verify a previously registered account, using the received code.',
        tags: ['auth'],
        response: {
          200: responseSchema,
          400: errorSchema,
          404: errorSchema,
          500: errorSchema
        },
        body: verifyUserSchema,
        headers: defaultHeadersSchema
      }
    },
    async function (request, reply) {
      const { userId, code } = request.body

      const user = await UserModel.findOne({ _id: new ObjectId(userId) })

      if (!user) {
        return reply.code(404).send({
          success: false,
          error: {
            name: 'userNotFound',
            message: `User with _id ${userId} not found`
          }
        })
      }

      const userIp =
        process.env.NODE_ENV === 'production'
          ? request.headers['cf-connecting-ip'] ??
            request.ips?.at(-1) ??
            request.ip
          : request.ip

      const ircClient = new IRCClient(userIp, this.log)
      await ircClient.verify({ username: user.nick, code })

      const updatedUser = (await UserModel.findOneAndUpdate(
        { _id: user._id },
        { $set: { verified: true } },
        { returnDocument: 'after' }
      )) as UserDocument

      return reply.code(200).send({
        success: true,
        data: {
          ...updatedUser,
          _id: updatedUser._id.toString(),
          registered_date: updatedUser.registered_date.toISOString()
        },
        message: `User ${user.nick} verified successfully`,
        messageKey: 'verificationSuccessful'
      })
    }
  )
}
