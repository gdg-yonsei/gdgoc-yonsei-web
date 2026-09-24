import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('next/navigation', () => ({
  usePathname: () => '/en/session/25-26',
}))

import HeaderNavigation from '@/app/components/header/navigation'
import {
  getHeaderNavigationCopy,
  getHeaderNavigationLinks,
} from '@/app/components/header/navigation-links'

const renderNavigation = () =>
  render(
    <HeaderNavigation
      lang="en"
      links={getHeaderNavigationLinks('en')}
      copy={getHeaderNavigationCopy('en')}
    />
  )

describe('HeaderNavigation', () => {
  it('marks the current section and keeps the order', () => {
    renderNavigation()
    const nav = screen.getByRole('navigation', { name: 'Primary navigation' })
    const names = within(nav)
      .getAllByRole('link')
      .map((link) => link.textContent)

    expect(names).toEqual([
      'Sessions',
      'Projects',
      'Calendar',
      'Members',
      'GYMS',
    ])
    expect(within(nav).getByRole('link', { name: 'Sessions' })).toHaveAttribute(
      'aria-current',
      'page'
    )
    expect(
      within(nav).getByRole('link', { name: 'Projects' })
    ).not.toHaveAttribute('aria-current')
  })

  it('switches language without losing the page', () => {
    renderNavigation()
    const [group] = screen.getAllByRole('group', { name: 'Language' })

    expect(
      within(group!).getByRole('link', { name: /한국어/ })
    ).toHaveAttribute('href', '/ko/session/25-26')
  })

  it('opens the menu dialog and closes it when a link is chosen', async () => {
    const user = userEvent.setup()
    renderNavigation()
    const trigger = screen.getByRole('button', { name: 'Open navigation menu' })

    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    const dialog = screen.getByRole('dialog', { name: 'Menu' })
    expect(
      within(dialog).getByRole('button', { name: 'Close navigation menu' })
    ).toBeInTheDocument()

    await user.click(within(dialog).getByRole('link', { name: 'Calendar' }))
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })
})
