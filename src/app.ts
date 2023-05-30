import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import fastify from 'fastify'

import * as features from '@features/features.js'
import { CORS_ORIGINS } from '@utils/const.js'
import getErrorHandler from '@utils/error.js'
import { loadEnv, getDefaultOpts } from './config.js'

const createApp = (opts: ReturnType<typeof getDefaultOpts> = {}) => {
  const defaultOpts = getDefaultOpts()
  const app = fastify({ ...defaultOpts, ...opts })
  loadEnv(app)
  app.register(jwt, {
    secret: process.env.SECRET_KEY
  })
  if (process.env.NODE_ENV !== 'test') {
    app.register(cors, {
      origin: CORS_ORIGINS
    })
  }
  Object.entries(features).forEach(([name, actions]) =>
    Object.values(actions).forEach((action) =>
      app
        .register(action, { prefix: `/${name}` })
        .setErrorHandler(getErrorHandler())
    )
  )
  return app
}

export default createApp
