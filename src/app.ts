import fastify from 'fastify'
import jwt from '@fastify/jwt'

import * as features from '@features/features.js'
import getErrorHandler from '@utils/error.js'

const envToLogger = {
  development: {
    level: 'debug',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    }
  },
  production: true,
  test: false
} as const

const defaultOpts: Parameters<typeof fastify>[0] = {
  logger: envToLogger[process.env.NODE_ENV] ?? true,
  trustProxy: process.env.NODE_ENV === 'production'
}

const createApp = (opts: typeof defaultOpts = {}) => {
  const app = fastify({ ...defaultOpts, ...opts })
  if (process.env.NODE_ENV !== 'test') {
    const envVarsNotFound = [
      'MONGO_URI',
      'DB_NAME',
      'PORT',
      'IRCD_HOST',
      'IRCD_PORT',
      'WEBIRC_PASS',
      'SECRET_KEY'
    ].filter((env) => !process.env[env])
    if (envVarsNotFound.length > 0) {
      app.log.error(
        `Missing environment variables: ${envVarsNotFound.join(', ')}`
      )
      process.emit('SIGTERM')
    }
  }
  app.register(jwt, {
    secret: process.env.SECRET_KEY
  })
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
