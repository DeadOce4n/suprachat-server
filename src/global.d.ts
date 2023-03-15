import type { Filter } from 'mongodb'

declare module 'fastify' {
  interface FastifyRequest {
    filters?: Filter<Event>
  }
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: string
      NODE_ENV: 'development' | 'production' | 'test'
      MONGO_URI: string
      DB_NAME: string
      IRCD_PORT: string
      IRCD_HOST: string
      WEBIRC_PASS: string
      SECRET_KEY: string
      LOG_LEVEL: 'trace' | 'debug' | 'info' | 'warn' | 'error'
      CORS_ORIGINS: string
    }
  }
}
