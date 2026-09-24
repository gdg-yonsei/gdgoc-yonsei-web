import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import SectionTag from '@/app/components/site/section-tag'

describe('SectionTag', () => {
  it('is decorative: the section heading carries the name', () => {
    render(<SectionTag>{'<about />'}</SectionTag>)
    expect(screen.getByText('<about />')).toHaveAttribute('aria-hidden', 'true')
  })
})
