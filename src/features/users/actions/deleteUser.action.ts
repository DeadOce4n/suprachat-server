import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import type { FastifyInstance } from 'fastify'

import { errorSchema } from '@common/schemas.js'
import type { User, UserSchema } from '@features/users/module.js'
import { ObjectIdString, Roles } from '@utils/const.js'
import { createResponseSchema } from '@utils/func.js'

const paramsSchema = Type.Object(
  {
    _id: ObjectIdString
  },
  { additionalProperties: false }
)

const responseSchema = createResponseSchema(Type.Null())

export default async function (fastify: FastifyInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().delete(
    '/:_id',
    {
      schema: {
        params: paramsSchema,
        response: {
          200: responseSchema,
          404: errorSchema,
          409: errorSchema
        }
      }
    },
    async function (request, reply) {
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

      const userId = new fastify.mongo.ObjectId(request.params._id)
      const user = await users.findOne({ _id: userId })

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

      const decodedToken = await request.jwtVerify<
        UserSchema & { _id: string }
      >()

      if (decodedToken.role !== Roles.Admin) {
        return reply.code(409).send({
          success: false,
          errors: [
            {
              name: 'notEnoughPrivileges',
              message: 'You must be an admin to delete an user'
            }
          ]
        })
      }

      await users.findOneAndUpdate(
        { _id: userId },
        {
          $set: {
            active: false
          }
        },
        { returnDocument: 'after' }
      )

      return reply.code(200).send({
        success: true,
        data: null,
        message: 'User deleted successfully'
      })
    }
  )
}
