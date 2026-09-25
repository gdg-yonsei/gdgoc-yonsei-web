import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import Programs from '@/app/(home)/[lang]/_components/home/programs'

describe('Programs', () => {
  it('lists the six programs in order with their descriptions', () => {
    render(<Programs lang="en" />)

    expect(
      screen
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent)
    ).toEqual([
      'T19',
      'Part Sessions',
      'oTP & Demo Day',
      'Solution Challenge',
      'Yonsei × Korea Demo Day',
      'The Bridge Hackathon',
    ])
    expect(screen.getByText(/Tech at 19:00/)).toBeInTheDocument()
  })

  it('keeps every program in the sticky stack', () => {
    const { container } = render(<Programs lang="en" />)

    expect(container.querySelectorAll('.program-card')).toHaveLength(6)
    // `data-long` once let the Solution Challenge card scroll out of it.
    expect(container.querySelectorAll('[data-long]')).toHaveLength(0)
  })

  it('numbers the cards with a decorative index', () => {
    const { container } = render(<Programs lang="en" />)
    const indexes = [...container.querySelectorAll('.program-index')]

    expect(indexes.map((index) => index.textContent)).toEqual([
      '01',
      '02',
      '03',
      '04',
      '05',
      '06',
    ])
    for (const index of indexes) {
      expect(index).toHaveAttribute('aria-hidden', 'true')
    }
  })

  it('draws the Solution Challenge funnel as an ordered list', () => {
    render(<Programs lang="ko" />)
    const funnel = screen.getByRole('figure', {
      name: 'Solution Challenge 2023',
    })

    expect(
      within(funnel)
        .getAllByRole('listitem')
        .map((step) => step.textContent)
    ).toEqual([
      '2,100전 세계 참가 팀',
      '6GDG Yonsei 참가 팀',
      '3Top 100 선정',
      '1Top 10 파이널리스트',
    ])
  })
})
