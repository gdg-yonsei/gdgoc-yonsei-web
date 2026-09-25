import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Parts from '@/app/(home)/[lang]/_components/home/parts'

describe('Parts', () => {
  it('describes all six parts with a link to their sessions', () => {
    render(<Parts lang="en" />)
    const items = screen.getAllByRole('listitem')

    expect(items).toHaveLength(6)
    expect(
      screen.getByRole('link', { name: 'ML/AI sessions' })
    ).toHaveAttribute('href', '/en/session?part=ML%2FAI')
    expect(
      screen.getByText(/server and infrastructure development/)
    ).toBeInTheDocument()
    for (const item of items) {
      expect(item.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    }
  })

  it('gives the curve glyph a dot to ride its path', () => {
    const { container } = render(<Parts lang="en" />)
    const curve = container.querySelector('.pg-draw')?.closest('svg')

    expect(curve?.querySelectorAll('.pg-rider')).toHaveLength(1)
    expect(container.querySelectorAll('.pg-rider')).toHaveLength(1)
  })

  it('colours each module with its part hue', () => {
    render(<Parts lang="ko" />)

    expect(
      screen.getAllByRole('listitem').map((item) => item.dataset.hue)
    ).toEqual(['blue', 'green', 'yellow', 'sky', 'pink', 'red'])
    expect(screen.getByRole('link', { name: 'Cloud 세션' })).toHaveAttribute(
      'href',
      '/ko/session?part=Cloud'
    )
  })
})
