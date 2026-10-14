import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ParsedAnalyticsEvent } from '@/lib/server/analytics/collect/schema'

const testDb = vi.hoisted(() => ({
  current: null as null | Awaited<
    ReturnType<
      typeof import('@/tests/helpers/analytics-test-db').createAnalyticsTestDb
    >
  >,
}))

vi.mock('@/db', () => ({
  get db() {
    return testDb.current!.db
  },
}))

import { createAnalyticsTestDb } from '@/tests/helpers/analytics-test-db'
import {
  storeAnalyticsBatch,
  type CollectContext,
} from '@/lib/server/analytics/collect/store'

const SESSION_ID = '0b6f4a0e-3d0c-4a43-9a51-7b0b3c2f8e11'
const VISITOR_ID = '6a0c2d84-5b8e-4d4f-a1a3-2f9e7c5b1d22'
const PAGE_VIEW_ID = '9f1e2d3c-4b5a-4c6d-8e7f-0a1b2c3d4e33'
const SECOND_PAGE_VIEW_ID = '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c44'
const NOW = new Date('2026-10-14T05:00:00.000Z')

const pageView = (
  overrides: Partial<Extract<ParsedAnalyticsEvent, { type: 'page_view' }>> = {}
) =>
  ({
    type: 'page_view',
    ageMs: 2_000,
    pageViewId: PAGE_VIEW_ID,
    sessionId: SESSION_ID,
    visitorId: VISITOR_ID,
    isNewVisitor: true,
    isSessionStart: true,
    sequence: 1,
    path: '/ko/session/?tag=web',
    title: '세션',
    referrer: 'https://www.google.com/search?q=gdgoc',
    utm: undefined,
    screenWidth: 390,
    screenHeight: 844,
    language: 'ko-KR',
    timezone: 'Asia/Seoul',
    isNotFound: false,
    ...overrides,
  }) satisfies ParsedAnalyticsEvent

function context(overrides: Partial<CollectContext> = {}): CollectContext {
  return {
    now: NOW,
    siteHost: 'gdgoc.yonsei.ac.kr',
    userAgent: { deviceType: 'mobile', browser: 'Safari', os: 'iOS' },
    resolveIsInternal: vi.fn(async () => false),
    ...overrides,
  }
}

async function rows(sql: string) {
  return (await testDb.current!.client.query<Record<string, unknown>>(sql)).rows
}

beforeEach(async () => {
  testDb.current = await createAnalyticsTestDb()
})

describe('storeAnalyticsBatch', () => {
  it('creates the session from the first page view with enriched attributes', async () => {
    await storeAnalyticsBatch([pageView()], context())

    const [session] = await rows(
      'select *, "startedAt"::text as "startedAtText" from analytics_sessions'
    )
    expect(session).toMatchObject({
      id: SESSION_ID,
      visitorId: VISITOR_ID,
      isNewVisitor: true,
      isInternal: false,
      landingPath: '/ko/session',
      referrerHost: 'google.com',
      referrerPath: '/search',
      channel: 'Organic Search',
      deviceType: 'mobile',
      browser: 'Safari',
      os: 'iOS',
      country: 'KR',
    })
    // timestamp 컬럼은 실제 UTC 시각을 시간대 없이 저장한다. 드라이버의 Date 해석 차이를 피하려고 문자열로 비교한다.
    expect(session!.startedAtText).toBe('2026-10-14 04:59:58')

    const [view] = await rows('select * from analytics_page_views')
    expect(view).toMatchObject({
      id: PAGE_VIEW_ID,
      path: '/ko/session',
      locale: 'ko',
      sequence: 1,
      engagementMs: 0,
    })
  })

  it('caps the event age at five minutes', async () => {
    await storeAnalyticsBatch([pageView({ ageMs: 60 * 60 * 1000 })], context())
    const [view] = await rows(
      'select "occurredAt"::text as "occurredAt" from analytics_page_views'
    )
    expect(view!.occurredAt).toBe('2026-10-14 04:55:00')
  })

  it('ignores a duplicate page view beacon', async () => {
    await storeAnalyticsBatch([pageView()], context())
    await storeAnalyticsBatch([pageView()], context())
    expect(await rows('select id from analytics_page_views')).toHaveLength(1)
    expect(await rows('select id from analytics_sessions')).toHaveLength(1)
  })

  it('asks for the internal flag only when it creates a session', async () => {
    const resolveIsInternal = vi.fn(async () => true)
    await storeAnalyticsBatch(
      [
        pageView(),
        pageView({
          pageViewId: SECOND_PAGE_VIEW_ID,
          isSessionStart: false,
          sequence: 2,
          path: '/ko/project',
        }),
      ],
      context({ resolveIsInternal })
    )
    expect(resolveIsInternal).toHaveBeenCalledTimes(1)
    const [session] = await rows('select "isInternal" from analytics_sessions')
    expect(session!.isInternal).toBe(true)
  })

  it('keeps the larger engagement and scroll values', async () => {
    const engagement = (engagementMs: number, maxScrollPercent: number) =>
      ({
        type: 'engagement',
        ageMs: 0,
        pageViewId: PAGE_VIEW_ID,
        sessionId: SESSION_ID,
        engagementMs,
        maxScrollPercent,
      }) satisfies ParsedAnalyticsEvent

    await storeAnalyticsBatch([pageView(), engagement(12_000, 60)], context())
    await storeAnalyticsBatch([engagement(8_000, 90)], context())

    const [view] = await rows(
      'select "engagementMs", "maxScrollPercent" from analytics_page_views'
    )
    expect(view).toEqual({ engagementMs: 12_000, maxScrollPercent: 90 })
  })

  it('stores clicks and web vitals against the page view session', async () => {
    await storeAnalyticsBatch(
      [
        pageView(),
        {
          type: 'click',
          ageMs: 0,
          pageViewId: PAGE_VIEW_ID,
          sessionId: SESSION_ID,
          path: '/ko',
          kind: 'cta',
          label: 'join_instagram',
          targetUrl: 'https://www.instagram.com/gdg.yonseiuniv/',
        },
        {
          type: 'web_vital',
          ageMs: 0,
          pageViewId: PAGE_VIEW_ID,
          sessionId: SESSION_ID,
          path: '/ko',
          metric: 'LCP',
          value: 2100.5,
          rating: 'good',
        },
      ],
      context()
    )
    const events = await rows(
      'select name, label, metric, rating, value from analytics_events order by id'
    )
    expect(events).toEqual([
      {
        name: 'cta',
        label: 'join_instagram',
        metric: null,
        rating: null,
        value: null,
      },
      {
        name: 'web_vital',
        label: null,
        metric: 'LCP',
        rating: 'good',
        value: 2100.5,
      },
    ])
  })

  it('skips events whose page view never arrived and still stores the rest', async () => {
    await storeAnalyticsBatch(
      [
        pageView(),
        {
          type: 'engagement',
          ageMs: 0,
          pageViewId: SECOND_PAGE_VIEW_ID,
          sessionId: SESSION_ID,
          engagementMs: 5_000,
          maxScrollPercent: 40,
        },
        {
          type: 'click',
          ageMs: 0,
          pageViewId: SECOND_PAGE_VIEW_ID,
          sessionId: SESSION_ID,
          path: '/ko',
          kind: 'outbound',
          targetUrl: 'https://velog.io/',
        },
      ],
      context()
    )
    expect(await rows('select id from analytics_page_views')).toHaveLength(1)
    expect(await rows('select id from analytics_events')).toHaveLength(0)
  })

  it('classifies a later page view that creates the session as Direct', async () => {
    await storeAnalyticsBatch(
      [pageView({ isSessionStart: false, sequence: 3, referrer: undefined })],
      context()
    )
    const [session] = await rows(
      'select channel, "landingPath" from analytics_sessions'
    )
    expect(session).toEqual({ channel: 'Direct', landingPath: '/ko/session' })
  })
})
