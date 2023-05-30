import type * as undici from 'undici'
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
      S3_ACCESS_KEY: string
      S3_SECRET_KEY: string
      S3_REGION: string
      S3_BUCKET_NAME: string
      VERCEL_API_URL: string
      VERCEL_PROJECT_ID: string
      VERCEL_ACCESS_TOKEN: string
    }
  }

  // Re-export undici fetch function and various classes to global scope.
  // These are classes and functions expected to be at global scope according to
  // Node.js v18 API documentation.
  // See: https://nodejs.org/dist/latest-v18.x/docs/api/globals.html
  export const { FormData, Headers, Request, Response, fetch }: typeof undici
}
