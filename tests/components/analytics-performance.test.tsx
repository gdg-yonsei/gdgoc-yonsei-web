import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PerformanceView from '@/app/(admin)/admin/analytics/_components/performance-view'
import AdminI18nProvider from '@/app/components/admin/admin-i18n-provider'
import { getAdminMessages } from '@/lib/admin-i18n'
import { DEFAULT_ANALYTICS_FILTER } from '@/lib/analytics/filters'
import { stubResizeObserver } from '@/tests/helpers/resize-observer'

stubResizeObserver()

describe('PerformanceView', () => {
  it('shows p75 values with their rating in words', () => {
    render(
      <AdminI18nProvider locale={'en'} messages={getAdminMessages('en')}>
        <PerformanceView
          filter={DEFAULT_ANALYTICS_FILTER}
          data={{
            summary: [
              {
                metric: 'LCP',
                p75: 3100,
                good: 5,
                needsImprovement: 4,
                poor: 1,
                samples: 10,
              },
              {
                metric: 'INP',
                p75: null,
                good: 0,
                needsImprovement: 0,
                poor: 0,
                samples: 0,
              },
              {
                metric: 'CLS',
                p75: 0.02,
                good: 10,
                needsImprovement: 0,
                poor: 0,
                samples: 10,
              },
              {
                metric: 'FCP',
                p75: 1200,
                good: 10,
                needsImprovement: 0,
                poor: 0,
                samples: 10,
              },
              {
                metric: 'TTFB',
                p75: 400,
                good: 10,
                needsImprovement: 0,
                poor: 0,
                samples: 10,
              },
            ],
            series: [],
            byDevice: [],
            slowestPages: [
              { path: '/ko/project', metric: 'LCP', p75: 4200, samples: 6 },
            ],
          }}
        />
      </AdminI18nProvider>
    )
    const lcp = screen.getByRole('region', { name: 'LCP' })
    expect(lcp).toHaveTextContent('3.10 s')
    expect(lcp).toHaveTextContent('Needs improvement')
    expect(screen.getByRole('region', { name: 'INP' })).toHaveTextContent('—')
    expect(screen.getByText('/ko/project')).toBeInTheDocument()
  })
})
