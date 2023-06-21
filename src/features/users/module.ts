import getUser from './actions/getUser.action.js'
import findUsers from './actions/findUsers.action.js'
import updateUser from './actions/updateUser.action.js'
import deleteUser from './actions/deleteUser.action.js'
import uploadProfilePicture from './actions/uploadProfilePicture.action.js'

export {
  default as UserModel,
  type UserDocument,
  type UserOptions
} from './entities/user.model.js'

export { userSchema } from './schemas/user.schema.js'

export default {
  getUser,
  findUsers,
  updateUser,
  deleteUser,
  uploadProfilePicture
}
