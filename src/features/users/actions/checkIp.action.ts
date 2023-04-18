import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import type { FastifyInstance } from 'fastify'

import { errorSchema } from '@common/schemas.js'
import { createResponseSchema } from '@utils/func.js'

const bodySchema = Type.Object({
  username: Type.String(),
  password: Type.Optional(Type.String())
})

const responseSchema = createResponseSchema(Type.Null())

export default async function (fastify: FastifyInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().post(
    '/check-ip',
    {
      schema: {
        body: bodySchema,
        response: {
          200: responseSchema,
          400: errorSchema
        }
      }
    },
    async function (request, reply) {
      this.log.debug(`request.ip ${request.ip}`)
      this.log.debug(`request.ips ${request.ips?.join(', ')}`)
      return reply.code(200).send({
        success: true,
        data: null,
        message: 'Success',
        messageKey: 'asdfg'
      })
    }
  )
}
