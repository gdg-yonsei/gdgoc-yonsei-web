import { z } from 'zod'

export const sessionValidation = z.object({
  name: z.string().nonempty('Name is required'),
  description: z.string().nonempty('Description is required'),
  mainImage: z.string().nonempty('Main Image is required'),
  contentImages: z.array(z.string()).nonempty('Content Images is required'),
  generationId: z.string().nonempty('Generation is required'),
})
