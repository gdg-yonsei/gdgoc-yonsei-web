/** 수집 API가 받는 배치의 검증 규칙. 공개 엔드포인트라 모든 문자열과 숫자에 상한을 둔다. */
import 'server-only'

import { z } from 'zod'
import { MAX_BATCH_EVENTS } from '@/lib/analytics/constants'
import { WEB_VITAL_NAMES } from '@/lib/analytics/events'

const uuid = z.uuid()
// 경과 시간 상한(5분)은 저장할 때 자른다. 여기서는 터무니없는 값만 거절한다.
const ageMs = z
  .number()
  .int()
  .min(0)
  .max(24 * 60 * 60 * 1000)
const path = z.string().startsWith('/').max(512)
const text = (max: number) => z.string().trim().min(1).max(max)
const screenSize = z.number().int().min(0).max(20_000)

const base = { ageMs, pageViewId: uuid, sessionId: uuid }

const pageViewSchema = z.object({
  ...base,
  type: z.literal('page_view'),
  visitorId: uuid,
  isNewVisitor: z.boolean(),
  isSessionStart: z.boolean(),
  sequence: z.number().int().min(1).max(10_000),
  path,
  title: text(300).optional(),
  referrer: text(1024).optional(),
  utm: z
    .object({
      source: text(200).optional(),
      medium: text(200).optional(),
      campaign: text(200).optional(),
      term: text(200).optional(),
      content: text(200).optional(),
    })
    .optional(),
  screenWidth: screenSize.optional(),
  screenHeight: screenSize.optional(),
  language: text(35).optional(),
  timezone: text(64).optional(),
  isNotFound: z.boolean(),
})

const engagementSchema = z.object({
  ...base,
  type: z.literal('engagement'),
  engagementMs: z
    .number()
    .int()
    .min(0)
    .max(24 * 60 * 60 * 1000),
  maxScrollPercent: z.number().int().min(0).max(100),
})

const clickSchema = z.object({
  ...base,
  type: z.literal('click'),
  path,
  kind: z.enum(['outbound', 'download', 'contact', 'cta']),
  label: text(100).optional(),
  targetUrl: text(1024).optional(),
})

const webVitalSchema = z.object({
  ...base,
  type: z.literal('web_vital'),
  path,
  metric: z.enum(WEB_VITAL_NAMES),
  value: z.number().min(0).max(600_000),
  rating: z.enum(['good', 'needs-improvement', 'poor']),
})

/** 한 번에 받는 이벤트 묶음. 트래커는 20개를 넘기면 여러 배치로 나눠 보낸다. */
export const analyticsBatchSchema = z.object({
  events: z
    .array(
      z.discriminatedUnion('type', [
        pageViewSchema,
        engagementSchema,
        clickSchema,
        webVitalSchema,
      ])
    )
    .min(1)
    .max(MAX_BATCH_EVENTS),
})

export type ParsedAnalyticsEvent = z.infer<
  typeof analyticsBatchSchema
>['events'][number]

export type ParsedPageView = z.infer<typeof pageViewSchema>
