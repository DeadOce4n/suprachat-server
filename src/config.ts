import type { FastifyServerOptions } from 'fastify'
import { env } from '@/utils/env.ts'

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
      level: env.LOG_LEVEL
    },
    test: false
  } as const

  const defaultOpts: FastifyServerOptions = {
    logger: envToLogger[env.NODE_ENV!],
    trustProxy: env.NODE_ENV === 'production'
  }

  return defaultOpts
}
