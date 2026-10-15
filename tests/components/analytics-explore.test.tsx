import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

const navigation = vi.hoisted(() => ({ replace: vi.fn() }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: navigation.replace }),
  usePathname: () => '/en/admin/analytics/explore',
  useSearchParams: () => new URLSearchParams('range=7d'),
}))

import ExploreView from '@/app/(admin)/admin/analytics/_components/explore-view'
import AdminI18nProvider from '@/app/components/admin/admin-i18n-provider'
import { getAdminMessages } from '@/lib/admin-i18n'
import { DEFAULT_ANALYTICS_FILTER } from '@/lib/analytics/filters'

describe('ExploreView', () => {
  it('renders the table and applies a new breakdown through the URL', async () => {
    render(
      <AdminI18nProvider locale={'en'} messages={getAdminMessages('en')}>
        <ExploreView
          filter={{ ...DEFAULT_ANALYTICS_FILTER, range: '7d' }}
          explore={{
            dimensions: ['channel'],
            metrics: ['sessions'],
            limit: 100,
          }}
          table={{
            columns: ['channel', 'sessions'],
            rows: [{ channel: 'Direct', sessions: 4 }],
          }}
          dimensionOptions={['channel', 'deviceType']}
          metricOptions={['sessions', 'users']}
        />
      </AdminI18nProvider>
    )
    expect(screen.getByRole('cell', { name: '4' })).toBeInTheDocument()
    await userEvent.selectOptions(
      screen.getByLabelText('Break down by'),
      'deviceType'
    )
    await userEvent.click(screen.getByRole('checkbox', { name: 'Users' }))
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))
    expect(navigation.replace).toHaveBeenCalledWith(
      '/en/admin/analytics/explore?range=7d&dims=deviceType&metrics=sessions%2Cusers',
      { scroll: false }
    )
  })
})
