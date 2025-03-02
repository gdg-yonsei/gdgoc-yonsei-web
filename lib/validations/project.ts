import { z } from 'zod'

export const projectValidation = z.object({
  name: z.string().nonempty('Name is required'),
  description: z.string().nonempty('Description is required'),
  content: z.string().nonempty('Content is required'),
  mainImage: z.string().nonempty('Main Image is required'),
  contentImages: z.array(z.string()).nonempty('Content Images is required'),
  participants: z.array(z.string()).nonempty('Participants is required'),
  generationId: z.string().nonempty('Generation is required'),
})
