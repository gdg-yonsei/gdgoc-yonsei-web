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
import * as sessions from '@/lib/server/analytics/queries/sessions'
import {
  getAnalyticsOverview,
  getAnalyticsTable,
  parseExploreInput,
} from '@/lib/server/services/admin/analytics'
import type { Actor } from '@/lib/server/services/admin/types'
import { insertSession } from '@/tests/helpers/analytics-fixtures'
import { createAnalyticsTestDb } from '@/tests/helpers/analytics-test-db'

const NOW = new Date('2026-10-14T05:00:00.000Z')
const actor = (
  role: Actor['role'],
  scopes: Actor['scopes'] = 'session'
): Actor => ({
  userId: `user-${role}`,
  role,
  scopes,
  via: scopes === 'session' ? 'web' : 'mcp',
})

beforeEach(async () => {
  testDb.current = await createAnalyticsTestDb()
  await insertSession(testDb.current.client, {
    id: '0b6f4a0e-3d0c-4a43-9a51-7b0b3c2f8e01',
    visitorId: '6a0c2d84-5b8e-4d4f-a1a3-2f9e7c5b1d01',
    startedAt: '2026-10-13 01:00:00',
    channel: 'Organic Search',
    views: [
      { path: '/ko', at: '2026-10-13 01:00:00', engagementMs: 4_000 },
      { path: '/ko/calendar', at: '2026-10-13 01:01:00', engagementMs: 9_000 },
    ],
  })
  await insertSession(testDb.current.client, {
    id: '0b6f4a0e-3d0c-4a43-9a51-7b0b3c2f8e02',
    visitorId: '6a0c2d84-5b8e-4d4f-a1a3-2f9e7c5b1d02',
    startedAt: '2026-09-10 01:00:00',
  })
})

describe('analytics service', () => {
  it('rejects unverified accounts', async () => {
    await expect(
      getAnalyticsOverview(actor('UNVERIFIED'), DEFAULT_ANALYTICS_FILTER, NOW)
    ).resolves.toMatchObject({
      ok: false,
      code: 'FORBIDDEN',
    })
  })

  it('builds the overview with zero-filled series and the previous period', async () => {
    const result = await getAnalyticsOverview(
      actor('MEMBER'),
      DEFAULT_ANALYTICS_FILTER,
      NOW
    )
    if (!result.ok) throw new Error(result.message)
    expect(result.data.totals).toMatchObject({
      sessions: 1,
      views: 2,
      engagementRate: 1,
    })
    expect(result.data.previousTotals).toMatchObject({
      sessions: 1,
      engagementRate: 0,
    })
    expect(result.data.series).toHaveLength(28)
    expect(result.data.series.at(-2)).toMatchObject({
      bucket: '2026-10-13',
      sessions: 1,
    })
    expect(result.data.series.at(-1)).toMatchObject({
      bucket: '2026-10-14',
      sessions: 0,
      engagementRate: 0,
    })
    expect(result.data.collectingSince).toBe('2026-09-10T01:00:00.000Z')
    expect(result.data.channels[0]).toMatchObject({
      name: 'Organic Search',
      sessions: 1,
    })
  })

  it('skips the previous period when comparison is off', async () => {
    const result = await getAnalyticsOverview(
      actor('MEMBER'),
      { ...DEFAULT_ANALYTICS_FILTER, compare: false },
      NOW
    )
    expect(result.ok && result.data.previousTotals).toBeNull()
  })

  it('turns a statement timeout into a friendly failure', async () => {
    const spy = vi
      .spyOn(sessions, 'aggregateSessions')
      .mockRejectedValueOnce(
        Object.assign(new Error('canceling statement'), { code: '57014' })
      )
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(
      getAnalyticsOverview(actor('MEMBER'), DEFAULT_ANALYTICS_FILTER, NOW)
    ).resolves.toMatchObject({
      ok: false,
      code: 'INTERNAL',
      message: expect.stringContaining('shorter date range'),
    })
    spy.mockRestore()
    consoleError.mockRestore()
  })

  it('serves table reports including explore', async () => {
    const pages = await getAnalyticsTable(
      actor('CORE'),
      'pages',
      DEFAULT_ANALYTICS_FILTER,
      undefined,
      NOW
    )
    expect(pages.ok && pages.data.rows.map((row) => row.path)).toEqual([
      '/ko',
      '/ko/calendar',
    ])

    const explore = await getAnalyticsTable(
      actor('CORE'),
      'explore',
      DEFAULT_ANALYTICS_FILTER,
      parseExploreInput({
        dims: 'channel,deviceType',
        metrics: 'sessions,engagementRate',
      }),
      NOW
    )
    expect(explore.ok && explore.data).toEqual({
      columns: ['channel', 'deviceType', 'sessions', 'engagementRate'],
      rows: [
        {
          channel: 'Organic Search',
          deviceType: 'desktop',
          sessions: 1,
          engagementRate: 1,
        },
      ],
    })
  })

  it('needs only the read scope for MCP tokens', async () => {
    const result = await getAnalyticsTable(
      actor('MEMBER', ['gyms:read']),
      'channels',
      DEFAULT_ANALYTICS_FILTER,
      undefined,
      NOW
    )
    expect(result.ok).toBe(true)
  })
})

describe('parseExploreInput', () => {
  it('keeps known values, caps at two dimensions and falls back to defaults', () => {
    expect(
      parseExploreInput({
        dims: 'channel,os,browser',
        metrics: 'users,bogus',
        limit: '9999',
      })
    ).toEqual({
      dimensions: ['channel', 'os'],
      metrics: ['users'],
      limit: 500,
    })
    expect(parseExploreInput({})).toEqual({
      dimensions: ['channel'],
      metrics: ['users', 'sessions', 'engagementRate', 'avgEngagementSeconds'],
      limit: 100,
    })
  })
})
