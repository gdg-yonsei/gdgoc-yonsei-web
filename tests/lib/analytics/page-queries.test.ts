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
import {
  getEvents,
  getNotFound,
  getPageDetail,
  getPages,
} from '@/lib/server/analytics/queries/pages'
import { withAnalyticsTimeout } from '@/lib/server/analytics/queries/sql'
import { insertSession } from '@/tests/helpers/analytics-fixtures'
import { createAnalyticsTestDb } from '@/tests/helpers/analytics-test-db'

const range = {
  filter: DEFAULT_ANALYTICS_FILTER,
  start: new Date('2026-10-01T00:00:00.000Z'),
  end: new Date('2026-10-08T00:00:00.000Z'),
}

beforeEach(async () => {
  testDb.current = await createAnalyticsTestDb()
  const client = testDb.current.client
  await insertSession(client, {
    id: '0b6f4a0e-3d0c-4a43-9a51-7b0b3c2f8e01',
    visitorId: '6a0c2d84-5b8e-4d4f-a1a3-2f9e7c5b1d01',
    startedAt: '2026-10-02 01:00:00',
    channel: 'Organic Search',
    views: [
      {
        path: '/ko',
        at: '2026-10-02 01:00:00',
        engagementMs: 10_000,
        scroll: 80,
        title: '홈 | GDGoC Yonsei',
      },
      {
        path: '/ko/session/25-26',
        at: '2026-10-02 01:01:00',
        engagementMs: 30_000,
        scroll: 50,
      },
    ],
    events: [
      {
        name: 'cta',
        at: '2026-10-02 01:00:30',
        viewIndex: 0,
        label: 'join_instagram',
      },
      {
        name: 'outbound',
        at: '2026-10-02 01:02:00',
        viewIndex: 1,
        targetUrl: 'https://velog.io/x',
      },
    ],
  })
  await insertSession(client, {
    id: '0b6f4a0e-3d0c-4a43-9a51-7b0b3c2f8e02',
    visitorId: '6a0c2d84-5b8e-4d4f-a1a3-2f9e7c5b1d02',
    startedAt: '2026-10-03 10:00:00',
    referrerHost: 'velog.io',
    channel: 'Referral',
    views: [
      { path: '/ko/old-link', at: '2026-10-03 10:00:00', isNotFound: true },
      {
        path: '/ko',
        at: '2026-10-03 10:00:10',
        engagementMs: 20_000,
        scroll: 100,
        title: '홈 | GDGoC Yonsei',
      },
    ],
    events: [
      {
        name: 'cta',
        at: '2026-10-03 10:00:20',
        viewIndex: 1,
        label: 'join_instagram',
      },
    ],
  })
})

describe('getPages', () => {
  it('reports views, engagement, scroll, entrances and exits per path', async () => {
    const rows = await withAnalyticsTimeout((tx) => getPages(tx, range))
    expect(rows[0]).toEqual({
      path: '/ko',
      title: '홈',
      contentGroup: 'home',
      views: 2,
      users: 2,
      avgEngagementSeconds: 15,
      scroll75Rate: 1,
      entrances: 1,
      exits: 1,
      exitRate: 0.5,
    })
  })
})

describe('getPageDetail', () => {
  it('lists previous and next pages with entrance and exit markers', async () => {
    const detail = await withAnalyticsTimeout((tx) =>
      getPageDetail(tx, { ...range, bucket: 'day', path: '/ko' })
    )
    expect(detail.totals.views).toBe(2)
    expect(detail.previousPages).toEqual([
      { path: '(entrance)', views: 1 },
      { path: '/ko/old-link', views: 1 },
    ])
    expect(detail.nextPages).toEqual([
      { path: '(exit)', views: 1 },
      { path: '/ko/session/25-26', views: 1 },
    ])
    expect(detail.scrollDepth).toEqual([
      { threshold: 25, rate: 1 },
      { threshold: 50, rate: 1 },
      { threshold: 75, rate: 1 },
      { threshold: 90, rate: 0.5 },
      { threshold: 100, rate: 0.5 },
    ])
    expect(detail.channels).toEqual([
      { channel: 'Organic Search', views: 1 },
      { channel: 'Referral', views: 1 },
    ])
    expect(detail.series).toEqual([
      { bucket: '2026-10-02', views: 1 },
      { bucket: '2026-10-03', views: 1 },
    ])
  })
})

describe('getEvents', () => {
  it('groups events by name and label or target', async () => {
    const rows = await withAnalyticsTimeout((tx) => getEvents(tx, range))
    expect(rows).toEqual([
      { name: 'cta', label: 'join_instagram', count: 2, sessions: 2 },
      { name: 'outbound', label: 'https://velog.io/x', count: 1, sessions: 1 },
    ])
  })
})

describe('getNotFound', () => {
  it('lists 404 paths with where visitors came from', async () => {
    const rows = await withAnalyticsTimeout((tx) => getNotFound(tx, range))
    expect(rows).toEqual([
      { path: '/ko/old-link', views: 1, referrer: 'velog.io' },
    ])
  })
})
