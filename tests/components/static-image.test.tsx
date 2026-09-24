import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import StaticImage from '@/app/components/site/static-image'

// StaticImage rebuilds next/image's getImageProps from Next internals; this
// fails if a Next upgrade makes the two drift apart.
describe('StaticImage', () => {
  it('renders exactly what getImageProps would', async () => {
    const { getImageProps } =
      await vi.importActual<typeof import('next/image')>('next/image')
    const input = {
      src: 'https://image.gdgyonsei.moveto.kr/sessions/a.webp',
      alt: '',
      width: 112,
      height: 84,
      sizes: '88px',
      className: 'log-thumb',
    }
    const { container } = render(<StaticImage {...input} />)
    const img = container.querySelector('img')
    const expected = getImageProps(input).props

    expect(img).not.toBeNull()
    for (const [key, value] of Object.entries(expected)) {
      if (typeof value !== 'string' && typeof value !== 'number') continue
      const attribute = key === 'className' ? 'class' : key.toLowerCase()
      expect(img?.getAttribute(attribute), key).toBe(String(value))
    }
    expect(img?.getAttribute('srcset')).toContain('/_next/image?url=')
  })
})
