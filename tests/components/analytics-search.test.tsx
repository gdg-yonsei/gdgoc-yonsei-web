import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SearchView from '@/app/(admin)/admin/analytics/_components/search-view'
import AdminI18nProvider from '@/app/components/admin/admin-i18n-provider'
import { getAdminMessages } from '@/lib/admin-i18n'
import { stubResizeObserver } from '@/tests/helpers/resize-observer'

stubResizeObserver()

const metrics = { clicks: 12, impressions: 480, ctr: 0.025, position: 6.4 }

function renderView(props: React.ComponentProps<typeof SearchView>) {
  return render(
    <AdminI18nProvider locale={'en'} messages={getAdminMessages('en')}>
      <SearchView {...props} />
    </AdminI18nProvider>
  )
}

describe('SearchView', () => {
  it('shows the setup steps when Search Console is not connected', () => {
    renderView({
      overview: { configured: false },
      opportunities: { configured: false },
    })
    expect(
      screen.getByRole('heading', { name: 'Connect Google Search Console' })
    ).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
  })

  it('shows totals, queries and the three opportunity lists', () => {
    renderView({
      overview: {
        configured: true,
        dataThrough: '2026-10-13',
        totals: metrics,
        previousTotals: { ...metrics, clicks: 6 },
        series: [{ date: '2026-10-13', ...metrics }],
        queries: [{ query: 'gdgoc yonsei', ...metrics }],
        pages: [{ page: '/ko', ...metrics }],
        devices: [{ device: 'mobile', ...metrics }],
        countries: [{ country: 'KOR', ...metrics }],
      },
      opportunities: {
        configured: true,
        dataThrough: '2026-10-13',
        lowCtr: [
          {
            query: 'gdgoc',
            page: '/ko',
            clicks: 1,
            impressions: 500,
            ctr: 0.002,
            position: 1.2,
            expectedCtr: 0.28,
          },
        ],
        strikingDistance: [],
        lowEngagementLandings: [
          {
            path: '/ko/session',
            sessions: 10,
            engagementRate: 0.2,
            avgEngagementSeconds: 5,
            impressions: 80,
            clicks: 2,
          },
        ],
      },
    })
    expect(
      screen.getByText('Search Console data through 2026-10-13')
    ).toBeInTheDocument()
    expect(screen.getByText('+100.0%')).toBeInTheDocument()
    expect(screen.getByText('gdgoc yonsei')).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Shown often, clicked rarely' })
    ).toHaveTextContent('28.0%')
    expect(
      screen.getByRole('region', { name: 'Almost on page one' })
    ).toHaveTextContent('Nothing stands out for this period.')
    expect(
      screen.getByRole('region', { name: 'Search visitors leave quickly' })
    ).toHaveTextContent('/ko/session')
  })
})
