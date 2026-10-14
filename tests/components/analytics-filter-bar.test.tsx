import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const navigation = vi.hoisted(() => ({
  replace: vi.fn(),
  search: 'range=7d&device=mobile',
  pathname: '/ko/admin/analytics/acquisition',
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: navigation.replace }),
  usePathname: () => navigation.pathname,
  useSearchParams: () => new URLSearchParams(navigation.search),
}))

import FilterBar from '@/app/(admin)/admin/analytics/_components/filter-bar'
import AnalyticsTabs from '@/app/(admin)/admin/analytics/_components/analytics-tabs'
import AdminI18nProvider from '@/app/components/admin/admin-i18n-provider'
import { getAdminMessages } from '@/lib/admin-i18n'

function renderWithI18n(node: React.ReactNode) {
  return render(
    <AdminI18nProvider locale={'en'} messages={getAdminMessages('en')}>
      {node}
    </AdminI18nProvider>
  )
}

beforeEach(() => {
  navigation.replace.mockClear()
  navigation.search = 'range=7d&device=mobile'
})

describe('FilterBar', () => {
  it('shows the current filter and writes changes to the URL', async () => {
    renderWithI18n(<FilterBar />)
    expect(screen.getByLabelText('Date range')).toHaveValue('7d')
    expect(screen.getByLabelText('Device')).toHaveValue('mobile')

    await userEvent.selectOptions(
      screen.getByLabelText('Channel'),
      'Organic Search'
    )
    expect(navigation.replace).toHaveBeenLastCalledWith(
      '/ko/admin/analytics/acquisition?range=7d&channel=Organic+Search&device=mobile',
      { scroll: false }
    )
  })

  it('reveals custom dates only for a custom range', async () => {
    renderWithI18n(<FilterBar />)
    expect(screen.queryByLabelText('From')).toBeNull()
    await userEvent.selectOptions(screen.getByLabelText('Date range'), 'custom')
    expect(navigation.replace).toHaveBeenLastCalledWith(
      '/ko/admin/analytics/acquisition?range=custom&device=mobile',
      {
        scroll: false,
      }
    )
  })

  it('resets every filter', async () => {
    renderWithI18n(<FilterBar />)
    await userEvent.click(screen.getByRole('button', { name: 'Reset filters' }))
    expect(navigation.replace).toHaveBeenLastCalledWith(
      '/ko/admin/analytics/acquisition',
      { scroll: false }
    )
  })
})

describe('AnalyticsTabs', () => {
  it('keeps the filter query on every tab and marks the current one', () => {
    renderWithI18n(<AnalyticsTabs />)
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'href',
      '/en/admin/analytics?range=7d&device=mobile'
    )
    expect(screen.getByRole('link', { name: 'Acquisition' })).toHaveAttribute(
      'aria-current',
      'page'
    )
  })
})
