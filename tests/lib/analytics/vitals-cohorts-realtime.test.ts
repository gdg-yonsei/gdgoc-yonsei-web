import { beforeEach, describe, expect, it, vi } from 'vitest'

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

import { DEFAULT_ANALYTICS_FILTER } from '@/lib/analytics/filters'
import { getRetention } from '@/lib/server/analytics/queries/cohorts'
import { getRealtime } from '@/lib/server/analytics/queries/realtime'
import { withAnalyticsTimeout } from '@/lib/server/analytics/queries/sql'
import { getWebVitals } from '@/lib/server/analytics/queries/vitals'
import { insertSession } from '@/tests/helpers/analytics-fixtures'
import { createAnalyticsTestDb } from '@/tests/helpers/analytics-test-db'

const sessionId = (n: number) =>
  `0b6f4a0e-3d0c-4a43-9a51-${String(n).padStart(12, '0')}`
const visitorId = (n: number) =>
  `6a0c2d84-5b8e-4d4f-a1a3-${String(n).padStart(12, '0')}`

beforeEach(async () => {
  testDb.current = await createAnalyticsTestDb()
})

describe('getWebVitals', () => {
  it('computes p75 and rating counts per metric', async () => {
    const lcp = [1000, 2000, 3000, 5000]
    for (const [index, value] of lcp.entries()) {
      await insertSession(testDb.current!.client, {
        id: sessionId(index + 1),
        visitorId: visitorId(index + 1),
        startedAt: '2026-10-02 01:00:00',
        deviceType: index < 2 ? 'mobile' : 'desktop',
        events: [
          {
            name: 'web_vital',
            at: '2026-10-02 01:00:05',
            metric: 'LCP',
            value,
            rating:
              value <= 2500
                ? 'good'
                : value <= 4000
                  ? 'needs-improvement'
                  : 'poor',
          },
        ],
      })
    }
    const report = await withAnalyticsTimeout((tx) =>
      getWebVitals(tx, {
        filter: DEFAULT_ANALYTICS_FILTER,
        start: new Date('2026-10-01T00:00:00Z'),
        end: new Date('2026-10-08T00:00:00Z'),
        bucket: 'day',
      })
    )
    expect(report.summary.find((row) => row.metric === 'LCP')).toEqual({
      metric: 'LCP',
      p75: 3500,
      good: 2,
      needsImprovement: 1,
      poor: 1,
      samples: 4,
    })
    expect(report.summary.find((row) => row.metric === 'INP')).toMatchObject({
      p75: null,
      samples: 0,
    })
    expect(report.byDevice).toContainEqual({
      deviceType: 'desktop',
      metric: 'LCP',
      p75: 4500,
      samples: 2,
    })
  })
})

describe('getRetention', () => {
  it('builds weekly cohorts from each visitor first session', async () => {
    // 코호트 주(서울 월요일 2026-09-28): 방문자 1·2. 방문자 1은 다음 주에도 방문.
    await insertSession(testDb.current!.client, {
      id: sessionId(1),
      visitorId: visitorId(1),
      startedAt: '2026-09-29 01:00:00',
    })
    await insertSession(testDb.current!.client, {
      id: sessionId(2),
      visitorId: visitorId(2),
      startedAt: '2026-09-30 01:00:00',
    })
    await insertSession(testDb.current!.client, {
      id: sessionId(3),
      visitorId: visitorId(1),
      startedAt: '2026-10-06 01:00:00',
      isNewVisitor: false,
    })
    const rows = await withAnalyticsTimeout((tx) =>
      getRetention(tx, {
        filter: DEFAULT_ANALYTICS_FILTER,
        end: new Date('2026-10-12T15:00:00Z'),
        weeks: 3,
      })
    )
    expect(rows).toEqual([{ cohort: '2026-09-28', size: 2, rates: [1, 0.5] }])
  })
})

describe('getRealtime', () => {
  it('counts visitors in the last five minutes and views per minute', async () => {
    await insertSession(testDb.current!.client, {
      id: sessionId(1),
      visitorId: visitorId(1),
      startedAt: '2026-10-14 04:57:00',
      views: [
        { path: '/ko', at: '2026-10-14 04:57:00' },
        { path: '/ko/session', at: '2026-10-14 04:59:30' },
      ],
    })
    await insertSession(testDb.current!.client, {
      id: sessionId(2),
      visitorId: visitorId(2),
      startedAt: '2026-10-14 04:40:00',
      views: [{ path: '/en', at: '2026-10-14 04:40:00' }],
    })
    const snapshot = await withAnalyticsTimeout((tx) =>
      getRealtime(tx, {
        now: new Date('2026-10-14T05:00:00Z'),
        includeInternal: false,
      })
    )
    expect(snapshot.activeVisitors).toBe(1)
    expect(snapshot.activePages).toEqual([{ path: '/ko/session', visitors: 1 }])
    expect(snapshot.perMinute).toHaveLength(30)
    expect(snapshot.perMinute.find((row) => row.minutesAgo === 0)?.views).toBe(
      1
    )
    expect(snapshot.perMinute.find((row) => row.minutesAgo === 20)?.views).toBe(
      1
    )
  })
})
