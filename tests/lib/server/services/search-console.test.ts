import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  fetchSearchAnalytics: vi.fn(),
  getSearchConsoleEnv: vi.fn(),
  aggregateSessions: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: {
    transaction: (work: (tx: unknown) => unknown) => work({ execute: vi.fn() }),
  },
}))
vi.mock('@/lib/server/analytics/search-console/reports', () => ({
  fetchSearchAnalytics: mocks.fetchSearchAnalytics,
}))
vi.mock('@/lib/server/env', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/server/env')>()),
  getSearchConsoleEnv: mocks.getSearchConsoleEnv,
}))
vi.mock('@/lib/server/analytics/queries/sessions', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/lib/server/analytics/queries/sessions')
  >()),
  aggregateSessions: mocks.aggregateSessions,
}))

import { DEFAULT_ANALYTICS_FILTER } from '@/lib/analytics/filters'
import { SearchConsoleError } from '@/lib/server/analytics/search-console/client'
import {
  getSearchConsoleOverview,
  getSeoOpportunities,
  searchDateWindow,
} from '@/lib/server/services/admin/search-console'
import type { Actor } from '@/lib/server/services/admin/types'

const NOW = new Date('2026-10-14T05:00:00.000Z')
const member: Actor = {
  userId: 'm',
  role: 'MEMBER',
  scopes: 'session',
  via: 'web',
}
const metrics = { clicks: 5, impressions: 100, ctr: 0.05, position: 4 }

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getSearchConsoleEnv.mockReturnValue({
    clientEmail: 'a@b.iam.gserviceaccount.com',
    privateKey: 'k',
    siteUrl: 'https://gdgoc.yonsei.ac.kr/',
  })
})

describe('searchDateWindow', () => {
  it('ends no later than yesterday in Seoul', () => {
    expect(searchDateWindow(DEFAULT_ANALYTICS_FILTER, NOW)).toEqual({
      startDate: '2026-09-17',
      endDate: '2026-10-13',
      previousStartDate: '2026-08-20',
      previousEndDate: '2026-09-16',
    })
  })
})

describe('getSearchConsoleOverview', () => {
  it('reports not configured without credentials and never calls the API', async () => {
    mocks.getSearchConsoleEnv.mockReturnValue(null)
    await expect(
      getSearchConsoleOverview(member, DEFAULT_ANALYTICS_FILTER, NOW)
    ).resolves.toEqual({
      ok: true,
      data: { configured: false },
    })
    expect(mocks.fetchSearchAnalytics).not.toHaveBeenCalled()
  })

  it('maps totals, series and dimension tables, applying device and path filters', async () => {
    mocks.fetchSearchAnalytics.mockImplementation(
      async (request: { dimensions: string[] }) => {
        const [dimension] = request.dimensions
        if (!dimension) return [{ keys: [], ...metrics }]
        if (dimension === 'page')
          return [
            { keys: ['https://gdgoc.yonsei.ac.kr/ko/session/'], ...metrics },
          ]
        if (dimension === 'device') return [{ keys: ['MOBILE'], ...metrics }]
        return [
          { keys: [dimension === 'date' ? '2026-10-13' : 'gdgoc'], ...metrics },
        ]
      }
    )
    const result = await getSearchConsoleOverview(
      member,
      { ...DEFAULT_ANALYTICS_FILTER, device: 'mobile', path: '/ko' },
      NOW
    )
    if (!result.ok || !result.data.configured) throw new Error('expected data')
    expect(result.data).toMatchObject({
      dataThrough: '2026-10-13',
      totals: metrics,
      previousTotals: metrics,
      series: [{ date: '2026-10-13', ...metrics }],
      queries: [{ query: 'gdgoc', ...metrics }],
      pages: [{ page: '/ko/session', ...metrics }],
      devices: [{ device: 'mobile', ...metrics }],
    })
    expect(mocks.fetchSearchAnalytics).toHaveBeenCalledWith(
      expect.objectContaining({
        device: 'MOBILE',
        pageContains: '/ko',
        endDate: '2026-10-13',
      })
    )
  })

  it('explains a permission error', async () => {
    mocks.fetchSearchAnalytics.mockRejectedValue(
      new SearchConsoleError(403, 'forbidden')
    )
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(
      getSearchConsoleOverview(member, DEFAULT_ANALYTICS_FILTER, NOW)
    ).resolves.toMatchObject({
      ok: false,
      message: expect.stringContaining('service account email'),
    })
    consoleError.mockRestore()
  })

  it('explains a quota error', async () => {
    mocks.fetchSearchAnalytics.mockRejectedValue(
      new SearchConsoleError(429, 'quota')
    )
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(
      getSearchConsoleOverview(member, DEFAULT_ANALYTICS_FILTER, NOW)
    ).resolves.toMatchObject({
      ok: false,
      message: expect.stringContaining('quota'),
    })
    consoleError.mockRestore()
  })

  it('rejects unverified accounts', async () => {
    await expect(
      getSearchConsoleOverview(
        { ...member, role: 'UNVERIFIED' },
        DEFAULT_ANALYTICS_FILTER,
        NOW
      )
    ).resolves.toMatchObject({ ok: false, code: 'FORBIDDEN' })
  })
})

describe('getSeoOpportunities', () => {
  it('combines Search Console rows with organic landing engagement', async () => {
    mocks.fetchSearchAnalytics.mockImplementation(
      async (request: { dimensions: string[] }) =>
        request.dimensions.join() === 'query,page'
          ? [
              {
                keys: ['gdgoc', 'https://gdgoc.yonsei.ac.kr/ko'],
                clicks: 1,
                impressions: 500,
                ctr: 0.002,
                position: 1.2,
              },
              {
                keys: ['study group', 'https://gdgoc.yonsei.ac.kr/ko/session'],
                clicks: 2,
                impressions: 80,
                ctr: 0.025,
                position: 11,
              },
            ]
          : [
              {
                keys: ['https://gdgoc.yonsei.ac.kr/ko/session'],
                clicks: 2,
                impressions: 80,
                ctr: 0.025,
                position: 11,
              },
            ]
    )
    mocks.aggregateSessions.mockResolvedValue([
      {
        dimensions: { landingPath: '/ko/session' },
        metrics: {
          users: 9,
          newUsers: 9,
          sessions: 10,
          engagedSessions: 2,
          views: 10,
          engagementMs: 50_000,
          keyEvents: 0,
        },
      },
    ])
    const result = await getSeoOpportunities(
      member,
      DEFAULT_ANALYTICS_FILTER,
      NOW
    )
    if (!result.ok || !result.data.configured) throw new Error('expected data')
    expect(result.data.lowCtr.map((row) => row.query)).toEqual(['gdgoc'])
    expect(result.data.strikingDistance.map((row) => row.query)).toEqual([
      'study group',
    ])
    expect(result.data.lowEngagementLandings).toEqual([
      {
        path: '/ko/session',
        sessions: 10,
        engagementRate: 0.2,
        avgEngagementSeconds: 5,
        impressions: 80,
        clicks: 2,
      },
    ])
    expect(mocks.aggregateSessions).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        dimensions: ['landingPath'],
        filter: expect.objectContaining({ channel: 'Organic Search' }),
      })
    )
  })
})
