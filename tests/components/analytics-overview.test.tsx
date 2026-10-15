import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import OverviewView from '@/app/(admin)/admin/analytics/_components/overview-view'
import AdminI18nProvider from '@/app/components/admin/admin-i18n-provider'
import { getAdminMessages } from '@/lib/admin-i18n'
import { DEFAULT_ANALYTICS_FILTER } from '@/lib/analytics/filters'
import {
  deriveSessionMetrics,
  EMPTY_SESSION_METRICS,
} from '@/lib/analytics/metrics'
import type { AnalyticsOverview } from '@/lib/server/services/admin/analytics'
import { stubResizeObserver } from '@/tests/helpers/resize-observer'

stubResizeObserver()

const metrics = (sessions: number) =>
  deriveSessionMetrics({
    ...EMPTY_SESSION_METRICS,
    sessions,
    users: sessions,
    engagedSessions: sessions,
    views: sessions * 2,
  })

const data: AnalyticsOverview = {
  range: {
    start: new Date('2026-10-12T15:00:00Z'),
    end: new Date('2026-10-14T15:00:00Z'),
    previousStart: new Date('2026-10-10T15:00:00Z'),
    previousEnd: new Date('2026-10-12T15:00:00Z'),
    bucket: 'day',
    days: 2,
  },
  collectingSince: '2026-09-01T00:00:00.000Z',
  totals: metrics(20),
  previousTotals: metrics(10),
  series: [
    { bucket: '2026-10-13', ...metrics(8) },
    { bucket: '2026-10-14', ...metrics(12) },
  ],
  previousSeries: [
    { bucket: '2026-10-11', ...metrics(4) },
    { bucket: '2026-10-12', ...metrics(6) },
  ],
  channels: [{ name: 'Organic Search', ...metrics(15) }],
  devices: [{ name: 'mobile', ...metrics(20) }],
  topPages: [],
}

function renderView(view: AnalyticsOverview) {
  return render(
    <AdminI18nProvider locale={'en'} messages={getAdminMessages('en')}>
      <OverviewView data={view} filter={DEFAULT_ANALYTICS_FILTER} />
    </AdminI18nProvider>
  )
}

describe('OverviewView', () => {
  it('shows KPI tiles with deltas against the previous period', () => {
    renderView(data)
    // 사용자·세션 타일이 모두 20이다.
    expect(screen.getAllByText('20').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('+100.0%').length).toBeGreaterThan(0)
    expect(screen.getByRole('figure', { name: 'Trend' })).toBeInTheDocument()
    expect(screen.getByText('Organic Search')).toBeInTheDocument()
  })

  it('shows the empty state when nothing was collected in the range', () => {
    renderView({
      ...data,
      totals: metrics(0),
      series: [],
      channels: [],
      devices: [],
    })
    expect(screen.getByText('No data yet')).toBeInTheDocument()
  })
})
