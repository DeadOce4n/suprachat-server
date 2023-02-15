import type { AnySchemaObject, default as Ajv } from 'ajv'
import { ObjectId } from '@fastify/mongodb'
import dayjs from 'dayjs'

const coercionFuncs = {
  'date-time': (value: string) => dayjs(value).toDate(),
  ObjectId: (value: string) => new ObjectId(value)
} as const

type CoercionType = keyof typeof coercionFuncs

export default function (ajv: Ajv) {
  return ajv.addKeyword({
    keyword: 'coerce',
    type: 'string',
    compile:
      (schema, parentSchema: AnySchemaObject & { format?: CoercionType }) =>
      (value, obj) => {
        if (schema && obj && parentSchema.format) {
          obj.parentData[obj.parentDataProperty] =
            coercionFuncs[parentSchema.format](value)
        }
        return true
      }
  })
}
