import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import type { FastifyInstance } from 'fastify'

import { errorSchema } from '@common/schemas.js'
import { userWithOidSchema, type User } from '../entities/user.model.js'
import { createResponseSchema, isObjectIdString } from '@utils/func.js'

const paramsSchema = Type.Object(
  {
    _id: Type.String()
  },
  { additionalProperties: false }
)

const responseSchema = createResponseSchema(
  Type.Omit(userWithOidSchema, ['password'], { additionalProperties: false })
)

export default async function (fastify: FastifyInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().get(
    '/:_id',
    {
      schema: {
        params: paramsSchema,
        response: {
          200: responseSchema,
          404: errorSchema
        }
      }
    },
    async function (request, reply) {
      const users = this.mongo.db?.collection<User>('users')
      if (!users) {
        return reply.code(500).send({
          success: false,
          error: {
            name: 'databaseUnavailable',
            message: 'Database connection error'
          }
        })
      }

      const user = await users.findOne(
        isObjectIdString(request.params._id)
          ? { _id: new fastify.mongo.ObjectId(request.params._id) }
          : { nick: request.params._id }
      )

      if (!user) {
        return reply.code(404).send({
          success: false,
          error: {
            name: 'userNotFound',
            message: `User with _id ${request.params._id} not found`
          }
        })
      }

      const data = {
        ...user,
        _id: user._id.toString(),
        registered_date: user.registered_date.toISOString()
      }

      return reply.code(200).send({
        success: true,
        data,
        message: 'User fetched successfully',
        messageKey: 'successUserFetch'
      })
    }
  )
}
