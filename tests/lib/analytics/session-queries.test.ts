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

import {
  DEFAULT_ANALYTICS_FILTER,
  type AnalyticsFilter,
} from '@/lib/analytics/filters'
import {
  aggregateSessions,
  collectingSince,
} from '@/lib/server/analytics/queries/sessions'
import { withAnalyticsTimeout } from '@/lib/server/analytics/queries/sql'
import { insertSession } from '@/tests/helpers/analytics-fixtures'
import { createAnalyticsTestDb } from '@/tests/helpers/analytics-test-db'

const START = new Date('2026-10-01T00:00:00.000Z')
const END = new Date('2026-10-08T00:00:00.000Z')
const V1 = '6a0c2d84-5b8e-4d4f-a1a3-2f9e7c5b1d01'
const V2 = '6a0c2d84-5b8e-4d4f-a1a3-2f9e7c5b1d02'
const V3 = '6a0c2d84-5b8e-4d4f-a1a3-2f9e7c5b1d03'

function run(
  filter: Partial<AnalyticsFilter>,
  dimensions: Parameters<typeof aggregateSessions>[1]['dimensions'] = []
) {
  return withAnalyticsTimeout((tx) =>
    aggregateSessions(tx, {
      filter: { ...DEFAULT_ANALYTICS_FILTER, ...filter },
      start: START,
      end: END,
      bucket: 'day',
      dimensions,
    })
  )
}

beforeEach(async () => {
  testDb.current = await createAnalyticsTestDb()
  const client = testDb.current.client
  // 참여: 2회 조회
  await insertSession(client, {
    id: '0b6f4a0e-3d0c-4a43-9a51-7b0b3c2f8e01',
    visitorId: V1,
    startedAt: '2026-10-02 01:00:00',
    channel: 'Organic Search',
    referrerHost: 'google.com',
    deviceType: 'mobile',
    views: [
      { path: '/ko', at: '2026-10-02 01:00:00', engagementMs: 4_000 },
      {
        path: '/ko/session/25-26',
        at: '2026-10-02 01:01:00',
        engagementMs: 3_000,
      },
    ],
  })
  // 이탈: 1회 조회, 5초
  await insertSession(client, {
    id: '0b6f4a0e-3d0c-4a43-9a51-7b0b3c2f8e02',
    visitorId: V2,
    startedAt: '2026-10-03 10:00:00',
    views: [
      { path: '/en/project', at: '2026-10-03 10:00:00', engagementMs: 5_000 },
    ],
  })
  // 참여: CTA 클릭, 재방문
  await insertSession(client, {
    id: '0b6f4a0e-3d0c-4a43-9a51-7b0b3c2f8e03',
    visitorId: V1,
    startedAt: '2026-10-05 12:00:00',
    isNewVisitor: false,
    channel: 'Organic Search',
    referrerHost: 'google.com',
    deviceType: 'mobile',
    views: [{ path: '/ko', at: '2026-10-05 12:00:00', engagementMs: 2_000 }],
    events: [
      { name: 'cta', at: '2026-10-05 12:00:05', label: 'join_instagram' },
    ],
  })
  // 내부 트래픽
  await insertSession(client, {
    id: '0b6f4a0e-3d0c-4a43-9a51-7b0b3c2f8e04',
    visitorId: V3,
    startedAt: '2026-10-04 09:00:00',
    isInternal: true,
    views: [
      {
        path: '/ko/100%_done',
        at: '2026-10-04 09:00:00',
        engagementMs: 60_000,
      },
    ],
  })
  // 기간 밖
  await insertSession(client, {
    id: '0b6f4a0e-3d0c-4a43-9a51-7b0b3c2f8e05',
    visitorId: V3,
    startedAt: '2026-09-20 09:00:00',
  })
})

describe('aggregateSessions', () => {
  it('totals the range and excludes internal traffic by default', async () => {
    const [row] = await run({})
    expect(row!.metrics).toEqual({
      users: 2,
      newUsers: 2,
      sessions: 3,
      engagedSessions: 2,
      views: 4,
      engagementMs: 14_000,
      keyEvents: 1,
    })
  })

  it('includes internal traffic on request', async () => {
    const [row] = await run({ includeInternal: true })
    expect(row!.metrics.sessions).toBe(4)
  })

  it('groups by dimensions and sorts by sessions', async () => {
    const rows = await run({}, ['channel', 'deviceType'])
    expect(rows.map((row) => [row.dimensions, row.metrics.sessions])).toEqual([
      [{ channel: 'Organic Search', deviceType: 'mobile' }, 2],
      [{ channel: 'Direct', deviceType: 'desktop' }, 1],
    ])
  })

  it('buckets by Seoul day', async () => {
    const rows = await run({}, ['date'])
    expect(
      Object.fromEntries(
        rows.map((row) => [row.dimensions.date, row.metrics.sessions])
      )
    ).toEqual({
      '2026-10-02': 1,
      '2026-10-03': 1,
      '2026-10-05': 1,
    })
  })

  it('applies session and page filters', async () => {
    expect((await run({ device: 'mobile' }))[0]!.metrics.sessions).toBe(2)
    expect((await run({ visitor: 'returning' }))[0]!.metrics.sessions).toBe(1)
    expect((await run({ locale: 'en' }))[0]!.metrics.sessions).toBe(1)
    expect(
      (await run({ contentGroup: 'session-list' }))[0]!.metrics.sessions
    ).toBe(1)
  })

  it('matches path filters literally, not as LIKE wildcards', async () => {
    expect(
      (await run({ includeInternal: true, path: '100%_' }))[0]!.metrics.sessions
    ).toBe(1)
    // '_o'를 와일드카드로 읽으면 '/ko'가 걸린다. 글자 그대로는 어느 경로에도 없다.
    expect(await run({ includeInternal: true, path: '_o' })).toEqual([])
  })

  it('returns no rows for an empty range', async () => {
    const rows = await withAnalyticsTimeout((tx) =>
      aggregateSessions(tx, {
        filter: DEFAULT_ANALYTICS_FILTER,
        start: new Date('2025-01-01T00:00:00Z'),
        end: new Date('2025-01-02T00:00:00Z'),
        bucket: 'day',
        dimensions: [],
      })
    )
    expect(rows).toEqual([])
  })
})

describe('collectingSince', () => {
  it('returns the first session start', async () => {
    const since = await withAnalyticsTimeout((tx) => collectingSince(tx))
    expect(since?.toISOString()).toBe('2026-09-20T09:00:00.000Z')
  })
})
