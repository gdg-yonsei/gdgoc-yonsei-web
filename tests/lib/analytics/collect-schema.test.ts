import { describe, expect, it } from 'vitest'
import { analyticsBatchSchema } from '@/lib/server/analytics/collect/schema'

const SESSION_ID = '0b6f4a0e-3d0c-4a43-9a51-7b0b3c2f8e11'
const VISITOR_ID = '6a0c2d84-5b8e-4d4f-a1a3-2f9e7c5b1d22'
const PAGE_VIEW_ID = '9f1e2d3c-4b5a-4c6d-8e7f-0a1b2c3d4e33'

const pageView = {
  type: 'page_view',
  ageMs: 12,
  pageViewId: PAGE_VIEW_ID,
  sessionId: SESSION_ID,
  visitorId: VISITOR_ID,
  isNewVisitor: true,
  isSessionStart: true,
  sequence: 1,
  path: '/ko/session/25-26',
  title: '세션 | GDGoC Yonsei',
  referrer: 'https://www.google.com/',
  utm: { source: 'instagram', medium: 'social' },
  screenWidth: 390,
  screenHeight: 844,
  language: 'ko-KR',
  timezone: 'Asia/Seoul',
  isNotFound: false,
}

describe('analyticsBatchSchema', () => {
  it('accepts every event type in one batch', () => {
    const result = analyticsBatchSchema.safeParse({
      events: [
        pageView,
        {
          type: 'engagement',
          ageMs: 0,
          pageViewId: PAGE_VIEW_ID,
          sessionId: SESSION_ID,
          engagementMs: 15_000,
          maxScrollPercent: 80,
        },
        {
          type: 'click',
          ageMs: 3,
          pageViewId: PAGE_VIEW_ID,
          sessionId: SESSION_ID,
          path: '/ko',
          kind: 'cta',
          label: 'join_instagram',
          targetUrl: 'https://www.instagram.com/gdg.yonseiuniv/',
        },
        {
          type: 'web_vital',
          ageMs: 1,
          pageViewId: PAGE_VIEW_ID,
          sessionId: SESSION_ID,
          path: '/ko',
          metric: 'LCP',
          value: 1834.2,
          rating: 'good',
        },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejects an empty batch and a batch over 20 events', () => {
    expect(analyticsBatchSchema.safeParse({ events: [] }).success).toBe(false)
    expect(
      analyticsBatchSchema.safeParse({
        events: Array.from({ length: 21 }, () => pageView),
      }).success
    ).toBe(false)
  })

  it('rejects malformed identifiers, paths and unknown event types', () => {
    const cases = [
      { ...pageView, sessionId: 'not-a-uuid' },
      { ...pageView, path: 'ko/session' },
      { ...pageView, path: `/${'a'.repeat(512)}` },
      { ...pageView, sequence: 0 },
      { ...pageView, type: 'purchase' },
    ]
    for (const event of cases) {
      expect(analyticsBatchSchema.safeParse({ events: [event] }).success).toBe(
        false
      )
    }
  })

  it('rejects out-of-range engagement and scroll values', () => {
    const engagement = {
      type: 'engagement',
      ageMs: 0,
      pageViewId: PAGE_VIEW_ID,
      sessionId: SESSION_ID,
      engagementMs: 15_000,
      maxScrollPercent: 80,
    }
    expect(
      analyticsBatchSchema.safeParse({
        events: [{ ...engagement, maxScrollPercent: 101 }],
      }).success
    ).toBe(false)
    expect(
      analyticsBatchSchema.safeParse({
        events: [{ ...engagement, engagementMs: -1 }],
      }).success
    ).toBe(false)
  })
})
