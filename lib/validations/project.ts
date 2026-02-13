import { z } from 'zod'

export const projectValidation = z.object({
  name: z.string().trim().nonempty('Name is required'),
  nameKo: z.string().trim().nonempty('Korean Name is required'),
  description: z.string().trim().nonempty('Description is required'),
  descriptionKo: z.string().trim().nonempty('Korean Description is required'),
  content: z.string().trim().nonempty('Content is required'),
  contentKo: z.string().trim().nonempty('Korean Content is required'),
  mainImage: z.string().trim().nonempty('Main Image is required'),
  contentImages: z
    .array(z.string().trim().min(1, 'Image URL is required'))
    .nonempty('Content Images is required'),
  participants: z
    .array(z.string().trim().min(1, 'Participant is required'))
    .nonempty('Participants is required')
    .refine((list) => new Set(list).size === list.length, {
      message: 'Participants must be unique.',
    }),
  generationId: z
    .string()
    .trim()
    .regex(/^\d+$/, 'Generation must be a numeric id')
    .refine((id) => Number(id) >= 1, {
      message: 'Generation is required',
    }),
})
