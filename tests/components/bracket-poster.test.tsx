import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import BracketPoster from '@/app/components/site/bracket-poster'

describe('BracketPoster', () => {
  it('draws the halftone with a CSS dot mask, never SVG patterns', () => {
    // SVG <pattern> fills rasterised as full-width white bands once the
    // brackets grew past ~150px (hero at 2560px, root 404).
    const { container } = render(<BracketPoster side="left" />)

    expect(container.querySelector('pattern')).toBeNull()
    expect(container.querySelectorAll('svg')).toHaveLength(2)
    expect(container.querySelector('.bracket-poster-dots')).not.toBeNull()
    expect(container.querySelector('.bracket-poster-tint')).not.toBeNull()
  })

  it('stays out of the accessibility tree', () => {
    const { container } = render(<BracketPoster side="right" />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })
})
