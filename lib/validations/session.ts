import { z } from 'zod'

export const sessionValidation = z.object({
  name: z.string().nonempty('Name is required'),
  nameKo: z.string().nonempty('Name (Korean) is required'),
  description: z.string().nonempty('Description is required'),
  descriptionKo: z.string().nonempty('Description (Korean) is required'),
  mainImage: z.string().nullable(),
  contentImages: z.array(z.string()),
  location: z.string().nonempty('location is required'),
  locationKo: z.string().nonempty('Location is required'),
  maxCapacity: z.number().min(1),
  internalOpen: z.boolean(),
  publicOpen: z.boolean(),
  startAt: z.date(),
  endAt: z.date(),
  partId: z.string().nonempty('PartId is required'),
  participantId: z.array(z.string()).nonempty('Participant is required'),
})
