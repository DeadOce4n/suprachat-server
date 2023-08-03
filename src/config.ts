import type { FastifyInstance, FastifyServerOptions } from 'fastify'
import { LOG_LEVEL } from '@/utils/const.ts'

export function loadEnv(app: FastifyInstance) {
  const requiredEnvVars = [
    'MONGO_URI',
    'DB_NAME',
    'PORT',
    'IRCD_HOST',
    'IRCD_PORT',
    'WEBIRC_PASS',
    'SECRET_KEY',
    'CORS_ORIGINS',
    'VERCEL_API_URL',
    'VERCEL_PROJECT_ID',
    'VERCEL_ACCESS_TOKEN',
    'PROFILE_PIC_MAX_SIZE'
  ]

  if (process.env.NODE_ENV !== 'test') {
    const undefinedEnvVars = requiredEnvVars.filter((env) => !process.env[env])
    if (undefinedEnvVars.length > 0) {
      app.log.error(
        `Missing environment variables: ${undefinedEnvVars.join(', ')}`
      )
      process.emit('SIGTERM')
    }
  }
}

export function getDefaultOpts() {
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
    production: {
      level: LOG_LEVEL
    },
    test: false
  } as const

  const defaultOpts: FastifyServerOptions = {
    logger: envToLogger[process.env.NODE_ENV] ?? true,
    trustProxy: process.env.NODE_ENV === 'production'
  }

  return defaultOpts
}
