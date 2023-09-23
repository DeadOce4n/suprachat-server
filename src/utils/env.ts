import type { Static, TSchema } from '@sinclair/typebox'
import { TypeCompiler } from '@sinclair/typebox/compiler'
import { Value } from '@sinclair/typebox/value'
import { Type, TypeRegistry, Kind } from '@sinclair/typebox'

export interface TStringEnum<T extends string[] = string[]> extends TSchema {
  [Kind]: 'StringEnum'
  static: T[number]
  type: 'string'
  enum: T
}

TypeRegistry.Set<TStringEnum>('StringEnum', (schema, value) => {
  return typeof value === 'string' && schema.enum.includes(value)
})

export const StringEnum = <T extends string[]>(
  values: [...T]
): TStringEnum<T> => {
  return {
    [Kind]: 'StringEnum',
    type: 'string',
    enum: values
  } as TStringEnum<T>
}

const compileParse = <T extends TSchema>(schema: T) => {
  const check = TypeCompiler.Compile(schema)

  return (input: unknown): Static<T> => {
    const convert = Value.Convert(schema, input)
    const checked = check.Check(convert)

    if (checked) return convert

    const { path, message } = check.Errors(convert).First()!

    throw new Error(`${path} ${message}`)
  }
}

const envSchema = Type.Object({
  NODE_ENV: StringEnum(['development', 'production', 'test']),
  MONGO_URI: Type.String(),
  DB_NAME: Type.String(),
  PORT: Type.Number(),
  IRCD_HOST: Type.String(),
  IRCD_PORT: Type.Number(),
  IRCD_ADMIN_USER: Type.String(),
  IRCD_ADMIN_PASS: Type.String(),
  IRCD_OPER_USER: Type.String(),
  IRCD_OPER_PASS: Type.String(),
  WEBIRC_PASS: Type.String(),
  SECRET_KEY: Type.String(),
  LOG_LEVEL: StringEnum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']),
  CORS_ORIGINS: Type.String(),
  S3_ACCESS_KEY: Type.String(),
  S3_SECRET_KEY: Type.String(),
  S3_REGION: Type.String(),
  S3_BUCKET_NAME: Type.String(),
  VERCEL_API_URL: Type.String(),
  VERCEL_PROJECT_ID: Type.String(),
  VERCEL_ACCESS_TOKEN: Type.String(),
  PROFILE_PIC_MAX_SIZE: Type.Number(),
  IPV6: Type.String()
})

const loadEnv = compileParse(
  process.env.NODE_ENV === 'test' ? Type.Partial(envSchema) : envSchema
)

export const env = loadEnv(process.env)
