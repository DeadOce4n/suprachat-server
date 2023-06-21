import { Type } from '@sinclair/typebox'
import { ObjectIdString, countries, Roles } from '@utils/const.js'
import { StringEnum } from '@utils/func.js'

export const userSchema = Type.Object(
  {
    _id: ObjectIdString,
    nick: Type.String({ minLength: 3, maxLength: 20 }),
    email: Type.String({ format: 'email' }),
    password: Type.String({ minLength: 8 }),
    country: Type.Optional(StringEnum([...countries])),
    about: Type.Optional(Type.String({ maxLength: 300 })),
    verified: Type.Boolean(),
    active: Type.Boolean(),
    registered_date: Type.String({ format: 'date-time' }),
    password_from: StringEnum(['ergo', 'supra']),
    picture: Type.Optional(Type.String({ format: 'uri' })),
    role: Type.Enum(Roles)
  },
  { additionalProperties: false }
)
