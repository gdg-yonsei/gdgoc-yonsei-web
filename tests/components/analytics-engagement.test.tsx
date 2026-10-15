import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import EngagementView from '@/app/(admin)/admin/analytics/_components/engagement-view'
import PageDetailView from '@/app/(admin)/admin/analytics/_components/page-detail-view'
import AdminI18nProvider from '@/app/components/admin/admin-i18n-provider'
import { getAdminMessages } from '@/lib/admin-i18n'
import { DEFAULT_ANALYTICS_FILTER } from '@/lib/analytics/filters'
import { stubResizeObserver } from '@/tests/helpers/resize-observer'

stubResizeObserver()

function withI18n(node: React.ReactNode) {
  return (
    <AdminI18nProvider locale={'en'} messages={getAdminMessages('en')}>
      {node}
    </AdminI18nProvider>
  )
}

describe('EngagementView', () => {
  it('links each page to its detail with the current filter', () => {
    render(
      withI18n(
        <EngagementView
          filter={{ ...DEFAULT_ANALYTICS_FILTER, device: 'mobile' }}
          data={{
            pages: [
              {
                path: '/ko/session/25-26',
                title: 'Sessions',
                contentGroup: 'session-list',
                views: 12,
                users: 9,
                avgEngagementSeconds: 41,
                scroll75Rate: 0.5,
                entrances: 4,
                exits: 3,
                exitRate: 0.25,
              },
            ],
            events: [
              { name: 'cta', label: 'join_instagram', count: 5, sessions: 4 },
            ],
            notFound: [{ path: '/ko/old', views: 2, referrer: 'velog.io' }],
          }}
        />
      )
    )
    expect(screen.getByRole('link', { name: 'Sessions' })).toHaveAttribute(
      'href',
      '/en/admin/analytics/engagement/page-detail?device=mobile&page=%2Fko%2Fsession%2F25-26'
    )
    expect(screen.getByText('41s')).toBeInTheDocument()
    expect(screen.getByText('join_instagram')).toBeInTheDocument()
    expect(screen.getByText('/ko/old')).toBeInTheDocument()
  })
})

describe('PageDetailView', () => {
  it('translates entrance and exit markers', () => {
    render(
      withI18n(
        <PageDetailView
          path={'/ko'}
          data={{
            totals: {
              views: 2,
              users: 2,
              avgEngagementSeconds: 15,
              scroll75Rate: 1,
              entrances: 1,
              exits: 1,
              exitRate: 0.5,
            },
            series: [{ bucket: '2026-10-14', views: 2 }],
            scrollDepth: [25, 50, 75, 90, 100].map((threshold) => ({
              threshold,
              rate: 0.5,
            })),
            previousPages: [{ path: '(entrance)', views: 1 }],
            nextPages: [{ path: '(exit)', views: 1 }],
            channels: [{ channel: 'Direct', views: 2 }],
          }}
        />
      )
    )
    expect(screen.getByText('Session start')).toBeInTheDocument()
    expect(screen.getByText('Left the site')).toBeInTheDocument()
  })
})
