import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Hero from '@/app/(home)/[lang]/_components/home/hero'

describe('Hero', () => {
  it('names the page after the chapter and links to sessions and projects', () => {
    render(<Hero lang="en" />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'GDGoC Yonsei' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Explore sessions/ })
    ).toHaveAttribute('href', '/en/session')
    expect(screen.getByRole('link', { name: 'See projects' })).toHaveAttribute(
      'href',
      '/en/project'
    )
  })

  it('uses Korean copy and routes on /ko', () => {
    render(<Hero lang="ko" />)

    expect(screen.getByRole('link', { name: /세션 둘러보기/ })).toHaveAttribute(
      'href',
      '/ko/session'
    )
    expect(screen.getByText('T19 · 매주 화 19:00')).toBeInTheDocument()
  })

  it('keeps the bracket artwork out of the accessibility tree', () => {
    const { container } = render(<Hero lang="en" />)
    const posters = container.querySelectorAll('[data-bracket] .bracket-poster')

    expect(posters).toHaveLength(2)
    posters.forEach((poster) =>
      expect(poster).toHaveAttribute('aria-hidden', 'true')
    )
    expect(container.querySelector('canvas')).toHaveAttribute(
      'aria-hidden',
      'true'
    )
  })
})
