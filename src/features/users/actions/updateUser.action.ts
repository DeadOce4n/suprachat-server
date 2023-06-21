import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import type { FastifyInstance } from 'fastify'
import { ObjectId } from 'mongodb'

import { errorSchema } from '@common/schemas.js'
import { countries, ObjectIdString, Roles } from '@utils/const.js'
import {
  checkPasswordHash,
  createResponseSchema,
  generatePasswordHash,
  StringEnum
} from '@utils/func.js'
import UserModel, { UserDocument } from '../entities/user.model.js'
import { userSchema } from '../schemas/user.schema.js'

const paramsSchema = Type.Object(
  {
    _id: ObjectIdString
  },
  { additionalProperties: false }
)

const bodySchema = Type.Partial(
  Type.Object({
    email: Type.String({ format: 'email' }),
    password: Type.String({ minLength: 8 }),
    country: StringEnum([...countries]),
    about: Type.String({ maxLength: 300 }),
    active: Type.Boolean(),
    picture: Type.String({ format: 'uri' })
  })
)

const responseSchema = createResponseSchema(Type.Omit(userSchema, ['password']))

export default async function (fastify: FastifyInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().patch(
    '/:_id',
    {
      schema: {
        params: paramsSchema,
        body: bodySchema,
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

      if (
        decodedToken._id !== userId.toString() &&
        decodedToken.role !== Roles.Admin
      ) {
        return reply.code(409).send({
          success: false,
          error: {
            name: 'notEnoughPrivileges',
            message: "You must be an admin to modify another user's data"
          }
        })
      }

      const updatePayload = {
        ...request.body
      }

      if (request.body.password) {
        if (await checkPasswordHash(user.password, request.body.password)) {
          return reply.code(409).send({
            success: false,
            error: {
              name: 'newPasswordSameAsOld',
              message: 'New password cannot be the same as the old one'
            }
          })
        }
        updatePayload.password = await generatePasswordHash(
          request.body.password
        )
      }

      const updatedUser = (await UserModel.findOneAndUpdate(
        { _id: userId },
        {
          $set: updatePayload
        },
        { returnDocument: 'after' }
      )) as UserDocument

      return reply.code(200).send({
        success: true,
        data: {
          ...updatedUser,
          _id: userId.toString(),
          registered_date: user.registered_date.toISOString()
        },
        message: 'User modified successfully',
        messageKey: 'successUserUpdate'
      })
    }
  )
}
