import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('recharts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('recharts')>()),
  ResponsiveContainer: ({ children }: { children: React.ReactElement }) => (
    <div style={{ width: 600, height: 280 }}>{children}</div>
  ),
}))

import AcquisitionView from '@/app/(admin)/admin/analytics/_components/acquisition-view'
import AdminI18nProvider from '@/app/components/admin/admin-i18n-provider'
import { getAdminMessages } from '@/lib/admin-i18n'
import { DEFAULT_ANALYTICS_FILTER } from '@/lib/analytics/filters'
import {
  deriveSessionMetrics,
  EMPTY_SESSION_METRICS,
} from '@/lib/analytics/metrics'

const m = (sessions: number) =>
  deriveSessionMetrics({
    ...EMPTY_SESSION_METRICS,
    sessions,
    users: sessions,
    engagedSessions: sessions,
  })

describe('AcquisitionView', () => {
  it('renders channels, search and AI sources, and CSV links that keep the filter', () => {
    render(
      <AdminI18nProvider locale={'en'} messages={getAdminMessages('en')}>
        <AcquisitionView
          filter={{ ...DEFAULT_ANALYTICS_FILTER, range: '7d' }}
          data={{
            channels: [
              { name: 'Organic Search', ...m(10) },
              { name: 'AI Assistants', ...m(3) },
            ],
            channelSeries: [
              {
                bucket: '2026-10-14',
                'Organic Search': 10,
                'AI Assistants': 3,
              },
            ],
            channelOrder: ['Organic Search', 'AI Assistants'],
            sources: [
              {
                source: 'google.com',
                medium: 'organic',
                channel: 'Organic Search',
                ...m(10),
              },
              {
                source: 'chatgpt.com',
                medium: 'referral',
                channel: 'AI Assistants',
                ...m(3),
              },
              {
                source: 'velog.io',
                medium: 'referral',
                channel: 'Referral',
                ...m(2),
              },
            ],
            referrers: [{ name: 'velog.io', ...m(2) }],
            campaigns: [],
            landingPages: [{ name: '/ko', ...m(12) }],
          }}
        />
      </AdminI18nProvider>
    )
    expect(
      screen.getByRole('figure', { name: 'Sessions by channel' })
    ).toBeInTheDocument()
    const searchAndAi = screen.getByRole('region', {
      name: 'Search engines and AI assistants',
    })
    expect(searchAndAi).toHaveTextContent('chatgpt.com')
    expect(searchAndAi).not.toHaveTextContent('velog.io')
    expect(
      screen.getAllByRole('link', { name: 'Download CSV' })[0]
    ).toHaveAttribute(
      'href',
      '/api/admin/analytics/export?report=channels&range=7d'
    )
  })
})
