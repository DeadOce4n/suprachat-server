import { schema, types } from 'papr'

import papr from '@common/db.js'
import { countries, EMAIL_REGEX, Roles } from '@utils/const.js'

const userSchema = schema(
  {
    nick: types.string({ maxLength: 20, minLength: 3, required: true }),
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
      pattern: EMAIL_REGEX,
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
