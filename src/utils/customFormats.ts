import type Ajv from 'ajv'

export default function (ajv: Ajv) {
  return ajv.addFormat('ObjectId', '^[0-9a-fA-F]{24}$')
}
