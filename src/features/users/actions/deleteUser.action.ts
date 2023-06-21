import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import type { FastifyInstance } from 'fastify'
import { ObjectId } from 'mongodb'

import { errorSchema } from '@common/schemas.js'
import { ObjectIdString, Roles } from '@utils/const.js'
import { createResponseSchema } from '@utils/func.js'
import UserModel, { UserDocument } from '../entities/user.model'

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
      const userId = new ObjectId(request.params._id)
      const user = await UserModel.findOne({ _id: userId })

      if (!user) {
        return reply.code(404).send({
          success: false,
          error: {
            name: 'userNotFound',
            message: `User with _id ${userId} not found`
          }
        })
      }

      const decodedToken = await request.jwtVerify<
        Omit<UserDocument, '_id'> & { _id: string }
      >()

      if (decodedToken.role !== Roles.Admin) {
        return reply.code(409).send({
          success: false,
          error: {
            name: 'notEnoughPrivileges',
            message: 'You must be an admin to delete an user'
          }
        })
      }

      await UserModel.findOneAndUpdate(
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
        message: 'User deleted successfully',
        messageKey: 'successDeleteUser'
      })
    }
  )
}
