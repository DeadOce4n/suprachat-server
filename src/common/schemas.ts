import { type Static, Type } from '@sinclair/typebox'

export const errorSchema = Type.Object(
  {
    success: Type.Literal(false),
    error: Type.Object(
      {
        name: Type.String(),
        message: Type.String()
      },
      { additionalProperties: false }
    ),
    additionalErrors: Type.Optional(
      Type.Array(
        Type.Object(
          {
            name: Type.String(),
            message: Type.String()
          },
          { additionalProperties: false }
        )
      )
    )
  },
  { additionalProperties: false }
)

export type ErrorSchema = Static<typeof errorSchema>

export const oidSchema = Type.Object(
  {
    _id: Type.String({ pattern: '^[0-9a-fA-F]{24}$' })
  },
  { additionalProperties: false }
)
