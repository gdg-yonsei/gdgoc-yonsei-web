import { z } from 'zod'
import { dateRegex } from '@/lib/yyyy-mm-dd-regex'

export const sessionValidation = z.object({
  name: z.string().nonempty('Name is required'),
  nameKo: z.string().nonempty('Name (Korean) is required'),
  description: z.string().nonempty('Description is required'),
  descriptionKo: z.string().nonempty('Description (Korean) is required'),
  mainImage: z.string().nullable(),
  contentImages: z.array(z.string()),
  eventDate: z.string().refine((date) => dateRegex.test(date), {
    message: 'Invalid date format. Use YYYY-MM-DD.',
  }),
  location: z.string().nonempty('location is required'),
  locationKo: z.string().nonempty('Location is required'),
  maxCapacity: z.number().min(1),
  openSession: z.boolean(),
  partId: z.string().nonempty('PartId is required'),
  participantId: z.array(z.string()).nonempty('Participant is required'),
})
