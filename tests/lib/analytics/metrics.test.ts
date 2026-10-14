import { describe, expect, it } from 'vitest'
import { toCsv } from '@/lib/analytics/csv'
import {
  EMPTY_SESSION_METRICS,
  deriveSessionMetrics,
  percentChange,
  rateWebVital,
} from '@/lib/analytics/metrics'

describe('deriveSessionMetrics', () => {
  it('derives GA4-style rates', () => {
    expect(
      deriveSessionMetrics({
        users: 80,
        newUsers: 50,
        sessions: 100,
        engagedSessions: 60,
        views: 250,
        engagementMs: 4_500_000,
        keyEvents: 7,
      })
    ).toMatchObject({
      engagementRate: 0.6,
      bounceRate: 0.4,
      viewsPerSession: 2.5,
      avgEngagementSeconds: 45,
    })
  })

  it('returns zeros instead of NaN when there are no sessions', () => {
    expect(deriveSessionMetrics(EMPTY_SESSION_METRICS)).toMatchObject({
      engagementRate: 0,
      bounceRate: 0,
      viewsPerSession: 0,
      avgEngagementSeconds: 0,
    })
  })
})

describe('percentChange', () => {
  it('is null without a previous value', () => {
    expect(percentChange(10, 0)).toBeNull()
    expect(percentChange(15, 10)).toBeCloseTo(0.5)
    expect(percentChange(5, 10)).toBeCloseTo(-0.5)
  })
})

describe('rateWebVital', () => {
  it.each([
    ['LCP', 2500, 'good'],
    ['LCP', 2501, 'needs-improvement'],
    ['LCP', 4001, 'poor'],
    ['INP', 199, 'good'],
    ['CLS', 0.26, 'poor'],
    ['TTFB', 900, 'needs-improvement'],
  ] as const)('%s %d → %s', (metric, value, rating) => {
    expect(rateWebVital(metric, value)).toBe(rating)
  })
})

describe('toCsv', () => {
  it('quotes separators and neutralizes spreadsheet formulas', () => {
    const csv = toCsv(
      ['path', 'title', 'views'],
      [
        { path: '/ko', title: 'Hello, "world"\nline', views: 3 },
        { path: '=HYPERLINK("x")', title: null, views: 0 },
      ]
    )
    expect(csv).toBe(
      '﻿path,title,views\r\n/ko,"Hello, ""world""\nline",3\r\n"\'=HYPERLINK(""x"")",,0\r\n'
    )
  })
})
