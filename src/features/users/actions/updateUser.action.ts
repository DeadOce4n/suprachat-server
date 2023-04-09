import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import type { FastifyInstance } from 'fastify'
import type { WithId } from 'mongodb'

import { errorSchema } from '@common/schemas.js'
import {
  userSchema,
  userWithOidSchema,
  type User,
  type UserSchema
} from '../entities/user.model.js'
import { ObjectIdString, Roles } from '@utils/const.js'
import { createResponseSchema } from '@utils/func.js'

const paramsSchema = Type.Object(
  {
    _id: ObjectIdString
  },
  { additionalProperties: false }
)

const bodySchema = Type.Partial(
  Type.Intersect([
    Type.Omit(
      userSchema,
      ['password', 'active', 'registered_date', 'role', 'verified'],
      {
        additionalProperties: false
      }
    ),
    Type.Object(
      {
        role: Type.Enum(Roles),
        verified: Type.Boolean()
      },
      { additionalProperties: false }
    )
  ]),
  { additionalProperties: false }
)

const responseSchema = createResponseSchema(
  Type.Omit(userWithOidSchema, ['password'])
)

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

      const userId = new fastify.mongo.ObjectId(request.params._id)
      const user = await users.findOne({ _id: userId })

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
        UserSchema & { _id: string }
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

      const updatedUser = (
        await users.findOneAndUpdate(
          { _id: userId },
          {
            $set: request.body
          },
          { returnDocument: 'after' }
        )
      ).value as WithId<User>

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
