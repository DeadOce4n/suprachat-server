import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import fastify from 'fastify'

import * as features from '@/features/features.ts'
import getErrorHandler from '@/utils/error.ts'
import { getDefaultOpts } from './config.ts'
import { env } from './utils/env.ts'

const createApp = async (opts: ReturnType<typeof getDefaultOpts> = {}) => {
  const app = fastify({ ...getDefaultOpts(), ...opts })

  app.register(jwt, {
    secret: env.SECRET_KEY!
  })

  if (env.NODE_ENV !== 'test') {
    app.register(cors, {
      origin: env.CORS_ORIGINS!.split(',')
    })
  }

  await Promise.all([
    app.register(swagger, {
      swagger: {
        info: {
          title: 'SupraChat',
          description: "SupraChat's REST-ish API",
          version: '1.0.0'
        }
      }
    }),
    app.register(swaggerUi, {
      prefix: '/docs',
      uiConfig: {
        docExpansion: 'list'
      }
    })
  ])

  await Promise.all(
    Object.entries(features).flatMap(([name, actions]) =>
      Object.values(actions).map((action) =>
        app
          .register(action, { prefix: `/${name}` })
          .setErrorHandler(getErrorHandler())
      )
    )
  )

  return app
}

export default createApp
