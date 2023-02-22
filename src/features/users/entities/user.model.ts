import { Type, type Static } from '@sinclair/typebox'

import { countries, Roles } from '@utils/const'
import { addOidToSchema, StringEnum } from '@utils/func'
import type { Prettify } from '@utils/types'

export const userSchema = Type.Object(
  {
    nick: Type.String({ maxLength: 20, minLength: 3 }),
    password: Type.String({ minLength: 8 }),
    email: Type.String({ format: 'email' }),
    country: Type.Optional(StringEnum([...countries])),
    about: Type.Optional(Type.String({ maxLength: 300 })),
    verified: Type.Boolean({ default: false }),
    active: Type.Boolean({ default: true }),
    registered_date: Type.String({ format: 'date-time' }),
    password_from: StringEnum(['ergo', 'supra']),
    picture: Type.Optional(Type.String({ format: 'uri' })),
    role: Type.Enum(Roles, { default: Roles.Normal })
  },
  { additionalProperties: false }
)

export type UserSchema = Static<typeof userSchema>

export const userWithOidSchema = addOidToSchema(userSchema)

export type User = Prettify<
  Omit<UserSchema, 'registered_date'> & {
    registered_date: Date
  }
>
