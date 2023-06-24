import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import type { FastifyInstance } from 'fastify'

import { errorSchema } from '@common/schemas.js'
import { createResponseSchema } from '@utils/func.js'
import {
  VERCEL_API_URL,
  VERCEL_PROJECT_ID,
  VERCEL_ACCESS_TOKEN,
  VERCEL_ENV_KEYS
} from '@utils/const.js'

const querySchema = Type.Object({
  projectId: Type.String(),
  field: Type.String()
})

const responseSchema = createResponseSchema(
  Type.Object(
    { env: Type.Record(Type.String(), Type.String()) },
    { additionalProperties: false }
  )
)

export default async function (fastify: FastifyInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().get(
    '/get-env',
    {
      schema: {
        description: "Get an environment variable's value from Vercel's API",
        tags: ['misc'],
        querystring: querySchema,
        response: {
          200: responseSchema,
          404: errorSchema,
          409: errorSchema,
          422: errorSchema
        }
      }
    },
    async function handler(request, reply) {
      const field = VERCEL_ENV_KEYS[request.query.field]

      if (!field) {
        return reply.code(404).send({
          success: false,
          error: {
            name: 'envVarNotFound',
            message: `Env var named ${request.query.field} not found`
          }
        })
      }
      const url = `${VERCEL_API_URL}/v1/projects/${VERCEL_PROJECT_ID}/env/${field}`
      this.log.info(url)
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${VERCEL_ACCESS_TOKEN}`
        }
      })

      const data = (await response.json()) as any

      if (!response.ok) {
        return reply.code(404).send({
          success: false,
          error: {
            name: 'vercelError',
            message: `An error ocurred when querying the Vercel API: ${JSON.stringify(
              data
            )}`
          }
        })
      }

      return reply.send({
        success: true,
        data: {
          env: {
            [request.query.field]: data.value
          }
        },
        messageKey: 'envFetchSuccess',
        message: `Fetched env var ${request.query.field} successfully`
      })
    }
  )
}
