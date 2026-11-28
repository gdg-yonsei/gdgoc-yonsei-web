// 웹 폼·MCP 응답에 검증 오류가 그대로 보여 영어로 쓴다.
import { z } from 'zod'
import {
  MAX_BODY_LENGTH,
  MAX_ID_LENGTH,
  MAX_IMAGES,
  MAX_PEOPLE,
  MAX_TITLE_LENGTH,
  MAX_URL_LENGTH,
} from '@/lib/validations/limits'

/** 세션 종류. DB `sessionType` enum과 같은 값이어야 한다. */
export const SESSION_TYPES = ['Part Session', 'General Session'] as const

/** 활동 분류. DB `activityCategory` enum과 같은 값이어야 한다. */
export const ACTIVITY_CATEGORIES = [
  'tech_talk',
  'part_session',
  'hackathon',
  'demo_day',
  'devrel',
] as const

export type SessionType = (typeof SESSION_TYPES)[number]
export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number]

const SessionTypeEnum = z.enum(SESSION_TYPES)

const ActivityCategoryEnum = z.enum(ACTIVITY_CATEGORIES)

export const sessionValidation = z
  .object({
    name: z
      .string()
      .trim()
      .nonempty('Name is required')
      .max(MAX_TITLE_LENGTH, 'Name is too long'),
    nameKo: z
      .string()
      .trim()
      .nonempty('Name (Korean) is required')
      .max(MAX_TITLE_LENGTH, 'Name (Korean) is too long'),
    description: z
      .string()
      .trim()
      .nonempty('Description is required')
      .max(MAX_BODY_LENGTH, 'Description is too long'),
    descriptionKo: z
      .string()
      .trim()
      .nonempty('Description (Korean) is required')
      .max(MAX_BODY_LENGTH, 'Description (Korean) is too long'),
    mainImage: z
      .string()
      .max(MAX_URL_LENGTH, 'Main Image URL is too long')
      .nullable(),
    contentImages: z
      .array(
        z
          .string()
          .trim()
          .min(1, 'Image URL is required')
          .max(MAX_URL_LENGTH, 'Image URL is too long')
      )
      .max(MAX_IMAGES, `Up to ${MAX_IMAGES} content images`),
    location: z
      .string()
      .trim()
      .nonempty('location is required')
      .max(MAX_TITLE_LENGTH, 'location is too long'),
    locationKo: z
      .string()
      .trim()
      .nonempty('Location is required')
      .max(MAX_TITLE_LENGTH, 'Location is too long'),
    maxCapacity: z.number().int().min(1).max(100_000),
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
      .array(
        z
          .string()
          .trim()
          .min(1, 'Participant is required')
          .max(MAX_ID_LENGTH, 'Invalid participant')
      )
      .max(MAX_PEOPLE, `Up to ${MAX_PEOPLE} participants`)
      .refine((list) => new Set(list).size === list.length, {
        message: 'Participant list must be unique.',
      }),
    type: SessionTypeEnum,
    category: ActivityCategoryEnum,
    displayOnWebsite: z.boolean(),
  })
  .refine((data) => data.startAt < data.endAt, {
    message: 'Start time must be before end time',
    path: ['endAt'],
  })
