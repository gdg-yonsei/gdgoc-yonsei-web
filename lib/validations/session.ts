import { z } from 'zod'
import { dateRegex } from '@/lib/yyyy-mm-dd-regex'

export const sessionValidation = z.object({
  name: z.string().nonempty('Name is required'),
  description: z.string().nonempty('Description is required'),
  mainImage: z.string().nonempty('Main Image is required'),
  contentImages: z.array(z.string()).nonempty('Content Images is required'),
  generationId: z.string().nonempty('Generation is required'),
  eventDate: z.string().refine((date) => dateRegex.test(date), {
    message: 'Invalid date format. Use YYYY-MM-DD.',
  }),
})
