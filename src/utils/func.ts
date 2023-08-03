import { Type, type TSchema } from '@sinclair/typebox'
import { createHash, pbkdf2, randomBytes } from 'crypto'
import { promisify } from 'util'
import bcrypt from 'bcrypt'

import { OBJECTID_REGEX } from './const.ts'

export const createResponseSchema = <TData extends TSchema>(
  dataSchema: TData
) =>
  Type.Object(
    {
      success: Type.Literal(true),
      message: Type.String(),
      messageKey: Type.String(),
      data: dataSchema,
      meta: Type.Optional(
        Type.Object({
          count: Type.Number(),
          offset: Type.Number(),
          limit: Type.Number(),
          total: Type.Number()
        })
      )
    },
    { additionalProperties: false }
  )

export const parseSortOperator = (operator?: string) => {
  const query: Record<string, 1 | -1> = {}
  if (!operator) {
    return query
  }
  let criteria: 1 | -1
  let field
  if (operator.startsWith('-')) {
    criteria = -1
    field = operator.substring(1)
  } else {
    criteria = 1
    field = operator
  }
  switch (field) {
    case 'start':
      field = 'dates.0.start'
      break
  }
  query[field] = criteria
  return query
}

const asyncRandomBytes = promisify(randomBytes)
const asyncPbkdf2 = promisify(pbkdf2)

export const generatePasswordHash = async (password: string) => {
  const saltLength = 16
  const salt = (await asyncRandomBytes(saltLength)).toString('hex')
  const iterations = 50000
  const keylen = 32
  const digest = 'sha256'
  const hash = await asyncPbkdf2(password, salt, iterations, keylen, digest)
  const encodedHash = hash.toString('hex')
  return `pbkdf2:${digest}:${iterations}$${salt}$${encodedHash}`
}

export const checkPasswordHash = async (
  hashedPassword: string,
  clearTextPassword: string
) => {
  const pieces = hashedPassword.split(/:|\$/)
  const digest = pieces[1] as string
  const iterations = parseInt(pieces[2] as string)
  const salt = pieces[3] as string
  const hash = pieces[4] as string
  const decodedHash = Buffer.from(hash, 'hex')
  const keylen = decodedHash.length
  const hashedClearTextPassword = await asyncPbkdf2(
    clearTextPassword,
    salt,
    iterations,
    keylen,
    digest
  )
  const encodedClearTextPassword = hashedClearTextPassword.toString('hex')
  return encodedClearTextPassword === hash
}

export const checkPasswordHashErgo = async (
  hashedPassword: string,
  clearTextPassword: string
) => {
  const hash = createHash('sha512')
  hash.update(clearTextPassword)
  const buff = Buffer.from(hashedPassword, 'base64')
  const decodedPasswordHash = buff.toString('utf8')
  const digest = hash.digest('hex')
  return bcrypt.compare(digest, decodedPasswordHash)
}

export const StringEnum = <T extends string[]>(values: [...T]) =>
  Type.Unsafe<T[number]>({ type: 'string', enum: values })

export const isObjectIdString = (str: string) =>
  new RegExp(OBJECTID_REGEX).test(str)
