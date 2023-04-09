import { ObjectId } from 'mongodb'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import fastifyMultipart from '@fastify/multipart'
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { Static, Type } from '@sinclair/typebox'
import type { FastifyInstance } from 'fastify'
import { nanoid } from 'nanoid/async'

import { errorSchema } from '@common/schemas.js'
import {
  ObjectIdString,
  PROFILE_PIC_MAX_SIZE,
  S3_BUCKET_NAME,
  S3_REGION
} from '@utils/const.js'
import { createResponseSchema } from '@utils/func.js'
import s3Client from '~/loaders/s3.js'
import type { userWithOidSchema, User } from '../entities/user.model.js'

const paramsSchema = Type.Object({ _id: ObjectIdString })
const responseSchema = createResponseSchema(
  Type.Object({ imageUrl: Type.String() })
)

export default async function (fastify: FastifyInstance) {
  fastify.register(fastifyMultipart, {
    limits: {
      fileSize: PROFILE_PIC_MAX_SIZE
    }
  })
  fastify.withTypeProvider<TypeBoxTypeProvider>().post(
    '/:_id/upload-profile-picture',
    {
      schema: {
        params: paramsSchema,
        response: {
          200: responseSchema,
          400: errorSchema,
          403: errorSchema,
          404: errorSchema,
          413: errorSchema
        }
      }
    },
    async function (request, reply) {
      const { _id } = request.params

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

      const user = await users.findOne({ _id: new ObjectId(_id) })

      if (!user) {
        return reply.code(404).send({
          success: false,
          error: {
            name: 'userNotFound',
            message: `User with _id ${_id} not found`
          }
        })
      }

      const userFromToken = await request.jwtVerify<
        Static<typeof userWithOidSchema>
      >()

      if (_id !== userFromToken._id) {
        return reply.code(403).send({
          success: false,
          error: {
            name: 'notEnoughPrivileges',
            message: "You must be an admin to modify another user's data"
          }
        })
      }

      try {
        const data = await request.file()
        if (!data) {
          return reply.code(400).send({
            success: false,
            error: {
              name: 'fileMissingInPayload',
              message: 'File is missing from payload'
            }
          })
        }

        const extension = data.filename.split('.').at(-1)
        const key = `${await nanoid()}${extension ? '.' + extension : ''}`

        await s3Client.send(
          new PutObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: key,
            Body: await data.toBuffer()
          })
        )

        const imageUrl = `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/${key}`

        await users.updateOne(
          { _id: new ObjectId(_id) },
          { $set: { picture: imageUrl } }
        )

        return reply.code(200).send({
          success: true,
          data: { imageUrl },
          message: 'Profile picture uploaded successfully',
          messageKey: 'uploadProfilePictureSuccess'
        })
      } catch (e) {
        this.log.error(e)
        return reply.code(413).send({
          success: false,
          error: {
            name: 'fileTooLarge',
            message: 'File size is too large'
          }
        })
      }
    }
  )
}
