import { schema, types } from 'papr'

import papr from '@/common/loaders/db.ts'
import { countries, URI_REGEX, Roles } from '@/utils/const.ts'

const userSchema = schema(
  {
    nick: types.string({ maxLength: 32, minLength: 1, required: true }),
    password: types.string({ minLength: 8, required: true }),
    email: types.string({ minLength: 5, required: true }),
    country: types.enum([...countries], { required: false }),
    about: types.string({ maxLength: 300, required: false }),
    verified: types.boolean({ required: true }),
    active: types.boolean({ required: true }),
    registered_date: types.date({ required: true }),
    password_from: types.enum(['ergo' as const, 'supra' as const], {
      required: true
    }),
    picture: types.string({
      pattern: URI_REGEX,
      required: false
    }),
    role: types.enum(Object.values(Roles), { required: true })
  },
  { defaults: { verified: false, active: true, role: Roles.Normal } }
)

export type UserDocument = (typeof userSchema)[0]
export type UserOptions = (typeof userSchema)[1]

const UserModel = papr.model('users', userSchema)

export default UserModel
