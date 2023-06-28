import { PutObjectCommand } from '@aws-sdk/client-s3'
import multipart from '@fastify/multipart'
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import type { FastifyInstance } from 'fastify'
import { ObjectId } from 'mongodb'
import { nanoid } from 'nanoid/async'
import sharp from 'sharp'

import { errorSchema } from '@common/schemas.js'
import {
  ALLOWED_IMG_MIME_TYPES,
  ObjectIdString,
  PROFILE_PIC_MAX_SIZE,
  Roles,
  S3_BUCKET_NAME,
  S3_REGION
} from '@utils/const.js'
import { createResponseSchema } from '@utils/func.js'
import s3Client from '@common/loaders/s3.js'
import type { UserDocument } from '../entities/user.model.js'
import UserModel from '../entities/user.model.js'

const paramsSchema = Type.Object({ _id: ObjectIdString })
const responseSchema = createResponseSchema(
  Type.Object({ imageUrl: Type.String() })
)

export default async function (fastify: FastifyInstance) {
  fastify.register(multipart, {
    limits: {
      fileSize: PROFILE_PIC_MAX_SIZE
    }
  })
  fastify.withTypeProvider<TypeBoxTypeProvider>().post(
    '/:_id/picture',
    {
      schema: {
        description: "Upload a user's profile picture",
        tags: ['users'],
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

      const user = await UserModel.findOne({ _id: new ObjectId(_id) })

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
        Omit<UserDocument, '_id'> & { _id: string }
      >()

      if (_id !== userFromToken._id && userFromToken.role !== Roles.Admin) {
        return reply.code(403).send({
          success: false,
          error: {
            name: 'notEnoughPrivileges',
            message: "You must be an admin to modify another user's data"
          }
        })
      }

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

      if (!ALLOWED_IMG_MIME_TYPES.includes(data.mimetype)) {
        return reply.code(400).send({
          success: false,
          error: {
            name: 'filetypeNotAllowed',
            message: `Files of type ${data.mimetype} are not allowed`
          }
        })
      }

      const image = sharp(await data.toBuffer())

      image.resize({
        width: 500,
        height: 500,
        fit: 'contain',
        background: (await image.stats()).dominant
      })

      try {
        const extension = data.filename.split('.').at(-1)
        const key = `${await nanoid()}${extension ? '.' + extension : ''}`

        await s3Client.send(
          new PutObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: key,
            Body: await image.toBuffer()
          })
        )

        const imageUrl = `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/${key}`

        await UserModel.updateOne(
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
