import { z } from 'zod'

export const projectValidation = z.object({
  name: z.string().nonempty('Name is required'),
  description: z.string().nonempty('Description is required'),
})
