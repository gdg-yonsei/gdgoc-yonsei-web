import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Join from '@/app/(home)/[lang]/_components/home/join'

describe('Join', () => {
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
