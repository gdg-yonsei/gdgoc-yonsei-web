import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import Manifesto from '@/app/(home)/[lang]/_components/home/manifesto'
import { landingCopy } from '@/lib/contents/site-copy'

describe('Manifesto', () => {
  it('reads as one statement, with the introduction and the GDG aside', () => {
    const { container } = render(<Manifesto lang="en" />)
    const section = screen.getByRole('region', {
      name: 'What is GDGoC Yonsei?',
    })

    expect(
      container.querySelector('.manifesto-statement')?.textContent?.trim()
    ).toBe(landingCopy.en.manifesto.statement)
    expect(
      within(section).getByRole('complementary', {
        name: 'What is GDG on Campus?',
      })
    ).toBeInTheDocument()
    expect(
      within(section).getByRole('link', { name: /The official GDG chapter/ })
    ).toHaveAttribute('rel', 'noreferrer noopener')
  })

  it('lists the three pillars with decorative glyphs', () => {
    render(<Manifesto lang="ko" />)
    const items = screen.getAllByRole('listitem')

    expect(
      items.map(
        (item) => within(item).getByRole('heading', { level: 3 }).textContent
      )
    ).toEqual(['커뮤니티', '기술', '지속 가능한 성장'])
    for (const item of items) {
      expect(item.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    }
  })
})
