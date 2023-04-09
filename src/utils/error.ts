import type { FastifyInstance, FastifyError } from 'fastify'

export class APIError extends Error {
  public override readonly name: string
  public readonly statusCode: number

  constructor(name: string, message = 'Unknown error', statusCode = 500) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)

    this.name = name
    this.statusCode = statusCode

    Error.captureStackTrace(this)
  }
}

export default function getErrorHandler(): Parameters<
  FastifyInstance['setErrorHandler']
>[0] {
  return async function (
    error: Error | FastifyError | APIError,
    _request,
    reply
  ) {
    this.log.error(error)
    const response = {
      success: false,
      error: {
        name: error.name,
        message: error.message
      },
      ...(('validation' in error &&
        error.validation.map((v) => ({
          name: v.keyword,
          message: v.message
        }))) ||
        [])
    }
    return reply
      .status('statusCode' in error ? error.statusCode ?? 500 : 500)
      .send(response)
  }
}
