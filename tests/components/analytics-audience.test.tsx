import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  usePathname: () => '/en/admin/analytics/audience',
}))

import AudienceView from '@/app/(admin)/admin/analytics/_components/audience-view'
import AdminI18nProvider from '@/app/components/admin/admin-i18n-provider'
import { getAdminMessages } from '@/lib/admin-i18n'
import { DEFAULT_ANALYTICS_FILTER } from '@/lib/analytics/filters'
import {
  deriveSessionMetrics,
  EMPTY_SESSION_METRICS,
} from '@/lib/analytics/metrics'
import { stubResizeObserver } from '@/tests/helpers/resize-observer'

stubResizeObserver()

const m = (sessions: number) =>
  deriveSessionMetrics({ ...EMPTY_SESSION_METRICS, sessions, users: sessions })

describe('AudienceView', () => {
  it('renders the retention grid, the weekday heatmap summary and country filter links', () => {
    render(
      <AdminI18nProvider locale={'en'} messages={getAdminMessages('en')}>
        <AudienceView
          filter={DEFAULT_ANALYTICS_FILTER}
          data={{
            newVsReturning: [
              { bucket: '2026-10-14', newUsers: 3, returningUsers: 1 },
            ],
            retention: [{ cohort: '2026-09-28', size: 10, rates: [1, 0.3] }],
            devices: [{ name: 'mobile', ...m(4) }],
            browsers: [{ name: 'KakaoTalk', ...m(2) }],
            operatingSystems: [{ name: 'iOS', ...m(3) }],
            screens: [{ name: '390x844', ...m(2) }],
            languages: [{ name: 'ko', ...m(4) }],
            countries: [{ name: 'KR', ...m(4) }],
            hourWeekday: [{ weekday: 0, hour: 21, sessions: 3 }],
          }}
        />
      </AdminI18nProvider>
    )
    expect(
      screen.getByRole('cell', { name: '2026-09-28 Week 1: 30.0%' })
    ).toBeInTheDocument()
    const heatmap = screen.getByRole('figure', {
      name: 'Sessions by weekday and hour (Seoul)',
    })
    expect(heatmap).toHaveAccessibleDescription(
      'Sessions by weekday and hour (Seoul): Mon 21, 3'
    )
    expect(screen.getByRole('link', { name: 'KR' })).toHaveAttribute(
      'href',
      '/en/admin/analytics/audience?country=KR'
    )
    expect(screen.getByText('KakaoTalk')).toBeInTheDocument()
  })
})
