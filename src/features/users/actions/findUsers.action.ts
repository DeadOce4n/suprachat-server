import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import type { FastifyInstance } from 'fastify'

import { errorSchema } from '@common/schemas.js'
import { createResponseSchema } from '@utils/func.js'
import { userWithOidSchema, type User } from '../entities/user.model.js'

const qsSchema = Type.Object({
  offset: Type.Optional(Type.Number()),
  limit: Type.Optional(Type.Number()),
  filter: Type.Optional(Type.String())
})

const responseSchema = createResponseSchema(
  Type.Array(Type.Omit(userWithOidSchema, ['password']))
)

export default async function (fastify: FastifyInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().get(
    '/',
    {
      schema: {
        response: {
          200: responseSchema,
          500: errorSchema
        },
        querystring: qsSchema
      }
    },
    async function (request, reply) {
      const collection = this.mongo.db?.collection<User>('users')
      if (!collection) {
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
      const { limit = 25, offset = 0, filter } = request.query

      const query = filter ? { nick: { $regex: filter, $options: 'i' } } : {}

      const users = await collection
        .find(query, { skip: offset, limit, sort: [['nick', 1]] })
        .toArray()

      const total = await collection.estimatedDocumentCount({})

      return reply.code(200).send({
        success: true,
        message: 'Users fetched successfully',
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
