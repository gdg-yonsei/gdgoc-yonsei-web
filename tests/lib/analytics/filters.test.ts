import { describe, expect, it } from 'vitest'
import { contentGroupOf } from '@/lib/analytics/content-groups'
import {
  DEFAULT_ANALYTICS_FILTER,
  analyticsFilterToSearchParams,
  parseAnalyticsFilter,
} from '@/lib/analytics/filters'

describe('contentGroupOf', () => {
  it.each([
    ['/ko', 'home'],
    ['/en/session', 'session-list'],
    ['/ko/session/25-26', 'session-list'],
    [
      '/ko/session/25-26/0b6f4a0e-3d0c-4a43-9a51-7b0b3c2f8e11',
      'session-detail',
    ],
    ['/en/project/25-26', 'project-list'],
    ['/en/project/25-26/12', 'project-detail'],
    ['/ko/member/25-26', 'member'],
    ['/ko/calendar', 'calendar'],
    ['/en/terms-of-service', 'legal'],
    ['/ko/unknown/page/here', 'other'],
  ])('%s → %s', (path, group) => {
    expect(contentGroupOf(path)).toBe(group)
  })
})

describe('parseAnalyticsFilter', () => {
  it('returns the defaults for an empty query', () => {
    expect(parseAnalyticsFilter({})).toEqual(DEFAULT_ANALYTICS_FILTER)
  })

  it('reads every supported key', () => {
    expect(
      parseAnalyticsFilter({
        range: 'custom',
        from: '2026-09-01',
        to: '2026-09-30',
        compare: '0',
        channel: 'Organic Search',
        device: 'mobile',
        country: 'kr',
        locale: 'en',
        visitor: 'returning',
        group: 'session-detail',
        path: '/ko/session',
        internal: '1',
      })
    ).toEqual({
      range: 'custom',
      from: '2026-09-01',
      to: '2026-09-30',
      compare: false,
      channel: 'Organic Search',
      device: 'mobile',
      country: 'KR',
      locale: 'en',
      visitor: 'returning',
      contentGroup: 'session-detail',
      path: '/ko/session',
      includeInternal: true,
    })
  })

  it('falls back to defaults for invalid values', () => {
    expect(
      parseAnalyticsFilter({
        range: 'abc',
        from: '2020-13-40',
        channel: 'Carrier pigeon',
        device: 'phone',
        country: 'Korea',
        locale: 'jp',
        visitor: 'vip',
        group: 'blog',
        path: ['a', 'b'],
      })
    ).toEqual(DEFAULT_ANALYTICS_FILTER)
  })

  it('drops custom dates unless the range is custom', () => {
    expect(
      parseAnalyticsFilter({ range: '7d', from: '2026-09-01' })
    ).toMatchObject({
      range: '7d',
      from: null,
      to: null,
    })
  })

  it('round-trips through search params and omits defaults', () => {
    const filter = {
      ...DEFAULT_ANALYTICS_FILTER,
      range: '90d' as const,
      device: 'desktop' as const,
    }
    const params = analyticsFilterToSearchParams(filter)
    expect(params.toString()).toBe('range=90d&device=desktop')
    expect(parseAnalyticsFilter(Object.fromEntries(params))).toEqual(filter)
  })
})
