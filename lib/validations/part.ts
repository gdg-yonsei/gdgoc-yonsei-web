import { z } from 'zod'

export const partValidation = z.object({
  name: z.string({ message: 'Name is required' }).nonempty('Name is required'),
  description: z.string().nullable(),
  generationId: z
    .number({ message: 'Invalid Generation' })
    .gte(1, { message: 'Invalid Generation' }),
  membersList: z.array(z.string()),
})
