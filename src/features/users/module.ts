import getUser from './actions/getUser.action.ts'
import findUsers from './actions/findUsers.action.ts'
import updateUser from './actions/updateUser.action.ts'
import deleteUser from './actions/deleteUser.action.ts'
import uploadProfilePicture from './actions/uploadProfilePicture.action.ts'

export {
  default as UserModel,
  type UserDocument,
  type UserOptions
} from './entities/user.model.ts'

export { userSchema } from './schemas/user.schema.ts'

export default {
  getUser,
  findUsers,
  updateUser,
  deleteUser,
  uploadProfilePicture
}
