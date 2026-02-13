import { z } from 'zod'

const SessionTypeEnum = z.enum(['Part Session', 'General Session'])

export const sessionValidation = z
  .object({
    name: z.string().trim().nonempty('Name is required'),
    nameKo: z.string().trim().nonempty('Name (Korean) is required'),
    description: z.string().trim().nonempty('Description is required'),
    descriptionKo: z.string().trim().nonempty('Description (Korean) is required'),
    mainImage: z.string().nullable(),
    contentImages: z.array(z.string().trim().min(1, 'Image URL is required')),
    location: z.string().trim().nonempty('location is required'),
    locationKo: z.string().trim().nonempty('Location is required'),
    maxCapacity: z.number().int().min(1),
    internalOpen: z.boolean(),
    publicOpen: z.boolean(),
    startAt: z.date(),
    endAt: z.date(),
    partId: z
      .string()
      .trim()
      .regex(/^\d+$/, 'PartId must be numeric')
      .refine((id) => Number(id) >= 1, {
        message: 'PartId is required',
      }),
    participantId: z
      .array(z.string().trim().min(1, 'Participant is required'))
      .nonempty('Participant is required')
      .refine((list) => new Set(list).size === list.length, {
        message: 'Participant list must be unique.',
      }),
    type: SessionTypeEnum,
    displayOnWebsite: z.boolean(),
  })
  .refine((data) => data.startAt < data.endAt, {
    message: 'Start time must be before end time',
    path: ['endAt'], // 에러를 표시할 필드 지정
  })
