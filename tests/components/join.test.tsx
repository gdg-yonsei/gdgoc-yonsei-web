import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Join from '@/app/(home)/[lang]/_components/home/join'

describe('Join', () => {
  it('sets each word of the title apart for the closing pop', () => {
    render(<Join lang="ko" />)
    const title = screen.getByRole('heading', { level: 2 })

    expect(
      [...title.querySelectorAll('.join-word')].map((word) => word.textContent)
    ).toEqual(['함께', '만들어요'])
    expect(title).toHaveAccessibleName('함께 만들어요')
  })

  it('sends people to Instagram first, then LinkedIn and the calendar', () => {
    render(<Join lang="en" />)

    expect(
      screen.getByRole('heading', { level: 2, name: 'Build with us' })
    ).toBeInTheDocument()
    expect(
      screen.getByText('Recruiting news goes out on Instagram first.')
    ).toBeInTheDocument()
    expect(
      screen
        .getAllByRole('link')
        .map((link) => [link.textContent, link.getAttribute('href')])
    ).toEqual([
      ['Follow on Instagram', 'https://www.instagram.com/gdg.yonseiuniv/'],
      ['LinkedIn', 'https://www.linkedin.com/company/gdsc-yonsei/'],
      ['See the calendar', '/en/calendar'],
    ])
  })
})
