import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import dayjs from 'dayjs'
import type { FastifyInstance } from 'fastify'
import type { DocumentForInsert } from 'papr'
import { omit } from 'remeda'

import { defaultHeadersSchema, errorSchema } from '@/common/schemas.ts'
import type { UserDocument, UserOptions } from '@/features/users/module.ts'
import { UserModel, userSchema } from '@/features/users/module.ts'
import IRCClient from '@/common/services/irc.service.ts'
import { Roles } from '@/utils/const.ts'
import { createResponseSchema, generatePasswordHash } from '@/utils/func.ts'
import { env } from '@/utils/env.ts'

const bodySchema = Type.Omit(userSchema, [
  '_id',
  'verified',
  'active',
  'registered_date',
  'password_from',
  'role'
])

const responseSchema = createResponseSchema(
  Type.Intersect([
    Type.Omit(userSchema, ['password']),
    Type.Object({ token: Type.String() })
  ])
)

export default async function (fastify: FastifyInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().post(
    '/signup',
    {
      schema: {
        description: 'Create a new account in the service and in the IRCd.',
        tags: ['auth'],
        body: bodySchema,
        response: {
          200: responseSchema,
          409: errorSchema,
          500: errorSchema
        },
        headers: defaultHeadersSchema
      }
    },
    async function (request, reply) {
      const {
        body: { nick, password, email }
      } = request
      const user = await UserModel.findOne({ $or: [{ nick }, { email }] })

      if (user) {
        return reply.code(409).send({
          success: false,
          error: {
            name: 'duplicateNick',
            message: `${
              user.nick === nick ? `Nick ${nick}` : `Email ${email}`
            } is already in use`
          }
        })
      }

      const [hasForbiddenChars, forbiddenChars] = IRCClient.verifyNick(nick)
      if (hasForbiddenChars) {
        return reply.code(400).send({
          success: false,
          error: {
            name: 'invalidNick',
            message: `Nick contains forbidden characters: ${forbiddenChars.join(
              ', '
            )}`
          }
        })
      }

      const userIp =
        env.NODE_ENV === 'production'
          ? request.headers['cf-connecting-ip'] ??
            request.ips?.at(-1) ??
            request.ip
          : request.ip

      this.log.debug(`Connection received from IP ${userIp}`)

      const ircClient = new IRCClient(userIp, this.log)

      await ircClient.register({
        username: nick,
        password,
        email
      })

      const newUser: DocumentForInsert<UserDocument, UserOptions> = {
        ...request.body,
        password: await generatePasswordHash(password),
        registered_date: dayjs().toDate(),
        password_from: 'supra',
        role: Roles.Normal
      }

      const insertedUser = await UserModel.insertOne(newUser)

      const now = dayjs()
      const expiration = now.clone().add(30, 'minutes')

      const token = this.jwt.sign(omit(insertedUser, ['password']), {
        expiresIn: expiration.diff(now).toString()
      })

      return reply.code(200).send({
        success: true,
        data: {
          ...insertedUser,
          _id: insertedUser._id.toString(),
          registered_date: newUser.registered_date.toISOString(),
          token
        },
        message: 'User registered successfully',
        messageKey: 'registrationSuccessful'
      })
    }
  )
}
