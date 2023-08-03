import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import fastify from 'fastify'

import * as features from '@/features/features.ts'
import { CORS_ORIGINS } from '@/utils/const.ts'
import getErrorHandler from '@/utils/error.ts'
import { getDefaultOpts, loadEnv } from './config.ts'

const createApp = async (opts: ReturnType<typeof getDefaultOpts> = {}) => {
  const app = fastify({ ...getDefaultOpts(), ...opts })

  loadEnv(app)

  app.register(jwt, {
    secret: process.env.SECRET_KEY
  })

  if (process.env.NODE_ENV !== 'test') {
    app.register(cors, {
      origin: CORS_ORIGINS
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
