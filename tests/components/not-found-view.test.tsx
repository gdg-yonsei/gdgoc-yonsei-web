import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import NotFoundView from '@/app/components/site/not-found-view'

describe('NotFoundView', () => {
  it('shows a single 404 heading between brackets and useful links', () => {
    render(<NotFoundView />)

    expect(
      screen.getByRole('heading', { level: 1, name: '404' })
    ).toBeInTheDocument()
    // The Playwright 404 matrix uses getByText('404'), so it must be unique.
    expect(screen.getAllByText(/404/)).toHaveLength(1)
    expect(screen.getByRole('link', { name: /Sessions/ })).toHaveAttribute(
      'href',
      '/session'
    )
  })

  it('lets the proxy choose the language for its links', () => {
    render(<NotFoundView />)

    expect(
      screen.getAllByRole('link').map((link) => link.getAttribute('href'))
    ).toEqual(['/', '/session', '/project'])
    expect(screen.getByText('세션')).toHaveAttribute('lang', 'ko')
  })
})
