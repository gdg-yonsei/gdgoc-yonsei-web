import { beforeEach, describe, expect, it, vi } from 'vitest'

const services = vi.hoisted(() => ({
  getAnalyticsOverview: vi.fn(),
  getAnalyticsTable: vi.fn(),
  getAnalyticsPageDetail: vi.fn(),
  getSearchConsoleTable: vi.fn(),
  getSeoOpportunities: vi.fn(),
}))

vi.mock('@/db', () => ({ db: {} }))
vi.mock('@/lib/server/services/admin/analytics', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/lib/server/services/admin/analytics')
  >()),
  getAnalyticsOverview: services.getAnalyticsOverview,
  getAnalyticsTable: services.getAnalyticsTable,
  getAnalyticsPageDetail: services.getAnalyticsPageDetail,
}))
vi.mock('@/lib/server/services/admin/search-console', () => ({
  getSearchConsoleTable: services.getSearchConsoleTable,
  getSeoOpportunities: services.getSeoOpportunities,
}))

import { DEFAULT_ANALYTICS_FILTER } from '@/lib/analytics/filters'
import { isToolVisible, type ToolDefinition } from '@/lib/mcp/registry'
import { ALL_TOOLS } from '@/lib/mcp/tools'
import type { Actor } from '@/lib/server/services/admin/types'

const tool = (name: string) =>
  ALL_TOOLS.find((candidate) => candidate.name === name) as ToolDefinition
const member: Actor = {
  userId: 'm',
  role: 'MEMBER',
  scopes: ['gyms:read'],
  via: 'mcp',
}
const NAMES = [
  'analytics_overview',
  'analytics_report',
  'analytics_page_detail',
  'search_console_report',
  'seo_opportunities',
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('analytics tools', () => {
  it('are visible to any approved member with the read scope and marked read-only', () => {
    for (const name of NAMES) {
      expect(isToolVisible(member, tool(name))).toBe(true)
      expect(isToolVisible({ ...member, role: 'UNVERIFIED' }, tool(name))).toBe(
        false
      )
      expect(tool(name).annotations?.readOnlyHint).toBe(true)
    }
  })

  it('rejects an unknown range or report before calling a service', () => {
    expect(
      tool('analytics_overview').input.safeParse({ range: 'forever' }).success
    ).toBe(false)
    expect(
      tool('analytics_report').input.safeParse({ report: 'revenue' }).success
    ).toBe(false)
    expect(
      tool('analytics_page_detail').input.safeParse({ path: 'ko' }).success
    ).toBe(false)
  })

  it('rejects impossible or incomplete custom dates instead of falling back to 28 days', () => {
    const input = tool('analytics_report').input
    const parse = (extra: object) =>
      input.safeParse({ report: 'pages', ...extra }).success
    expect(
      parse({ range: 'custom', from: '2026-02-30', to: '2026-03-10' })
    ).toBe(false)
    expect(parse({ range: 'custom', from: '2026-03-01' })).toBe(false)
    expect(parse({ from: '2026-03-01', to: '2026-03-10' })).toBe(false)
    expect(
      parse({ range: 'custom', from: '2026-03-01', to: '2026-03-10' })
    ).toBe(true)
    expect(
      tool('search_console_report').input.safeParse({
        dimension: 'query',
        range: 'custom',
        to: '2026-03-10',
      }).success
    ).toBe(false)
  })

  it('passes a parsed filter to the overview service', async () => {
    services.getAnalyticsOverview.mockResolvedValue({
      ok: true,
      data: { totals: {} },
    })
    const input = tool('analytics_overview').input.parse({
      range: '7d',
      device: 'mobile',
      compare: false,
    })
    await tool('analytics_overview').run(member, input)
    expect(services.getAnalyticsOverview).toHaveBeenCalledWith(member, {
      ...DEFAULT_ANALYTICS_FILTER,
      range: '7d',
      device: 'mobile',
      compare: false,
    })
  })

  it('runs explore through analytics_report and trims rows to the limit', async () => {
    services.getAnalyticsTable.mockResolvedValue({
      ok: true,
      data: {
        columns: ['channel', 'sessions'],
        rows: [
          { channel: 'Direct', sessions: 3 },
          { channel: 'Referral', sessions: 1 },
        ],
      },
    })
    const input = tool('analytics_report').input.parse({
      report: 'explore',
      dimensions: ['channel'],
      metrics: ['sessions'],
      limit: 1,
    })
    const result = await tool('analytics_report').run(member, input)
    expect(services.getAnalyticsTable).toHaveBeenCalledWith(
      member,
      'explore',
      DEFAULT_ANALYTICS_FILTER,
      {
        dimensions: ['channel'],
        metrics: ['sessions'],
        limit: 1,
      }
    )
    expect(result).toEqual({
      ok: true,
      data: {
        columns: ['channel', 'sessions'],
        rows: [{ channel: 'Direct', sessions: 3 }],
        // 어떤 기간의 숫자인지 클라이언트가 알 수 있게 해석된 기간을 함께 준다.
        range: { start: expect.any(String), end: expect.any(String) },
      },
    })
  })

  it('explains how to connect Search Console when it is not configured', async () => {
    services.getSearchConsoleTable.mockResolvedValue({
      ok: true,
      data: { configured: false },
    })
    const result = await tool('search_console_report').run(
      member,
      tool('search_console_report').input.parse({ dimension: 'query' })
    )
    expect(result).toMatchObject({
      ok: false,
      code: 'NOT_FOUND',
      message: expect.stringContaining('GSC_CLIENT_EMAIL'),
    })
  })
})
