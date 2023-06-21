import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import type { FastifyInstance } from 'fastify'

import { createResponseSchema } from '@utils/func.js'
import UserModel from '../entities/user.model.js'
import { userSchema } from '../schemas/user.schema.js'

const qsSchema = Type.Object({
  offset: Type.Optional(Type.Number()),
  limit: Type.Optional(Type.Number()),
  filter: Type.Optional(Type.String())
})

const responseSchema = createResponseSchema(
  Type.Array(Type.Omit(userSchema, ['password']))
)

export default async function (fastify: FastifyInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().get(
    '/',
    {
      schema: {
        response: {
          200: responseSchema
        },
        querystring: qsSchema
      }
    },
    async function (request, reply) {
      const { limit = 25, offset = 0, filter } = request.query

      const query = filter ? { nick: { $regex: filter, $options: 'i' } } : {}

      const users = await UserModel.find(query, {
        skip: offset,
        limit,
        sort: [['nick', 1]]
      })

      const total = await UserModel.countDocuments({})

      return reply.code(200).send({
        success: true,
        message: 'Users fetched successfully',
        messageKey: 'successUsersFetch',
        data: users.map((user) => ({
          ...user,
          _id: user._id.toString(),
          registered_date: user.registered_date.toISOString()
        })),
        meta: {
          count: users.length,
          offset,
          limit,
          total
        }
      })
    }
  )
}
