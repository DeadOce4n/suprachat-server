import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import type { FastifyInstance } from 'fastify'
import { ObjectId } from 'mongodb'

import { errorSchema } from '@common/schemas.js'
import { createResponseSchema, isObjectIdString } from '@utils/func.js'
import UserModel from '../entities/user.model.js'
import { userSchema } from '../schemas/user.schema.js'

const paramsSchema = Type.Object(
  {
    _id: Type.String()
  },
  { additionalProperties: false }
)

const responseSchema = createResponseSchema(Type.Omit(userSchema, ['password']))

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
      const user = await UserModel.findOne(
        isObjectIdString(request.params._id)
          ? { _id: new ObjectId(request.params._id) }
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
