import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ImageGallery from '@/app/components/site/gallery/image-gallery'

describe('ImageGallery', () => {
  beforeEach(() =>
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
  )
  afterEach(() => vi.unstubAllGlobals())

  it.each([true, false])(
    'respects reduced motion = %s when advancing',
    async (reduced) => {
      vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: reduced }))
      const user = userEvent.setup()
      render(
        <ImageGallery lang="en" images={['/a.webp', '/b.webp']} alt="Poster" />
      )
      await user.click(screen.getByRole('button', { name: 'Next image' }))
      expect(HTMLElement.prototype.scrollTo).toHaveBeenCalledWith({
        left: 0,
        behavior: reduced ? 'instant' : 'smooth',
      })
      expect(screen.getByText('2 / 2')).toBeInTheDocument()
    }
  )

  it('counts images and moves with buttons, thumbnails and arrow keys', async () => {
    const user = userEvent.setup()
    render(
      <ImageGallery
        lang="en"
        images={['/a.webp', '/b.webp', '/c.webp']}
        alt="Sixth T19"
      />
    )
    const gallery = screen.getByRole('group', { name: 'Sixth T19' })

    expect(screen.getByText('1 / 3')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Previous image' })
    ).toBeDisabled()

    gallery.querySelector<HTMLElement>('[tabindex="0"]')?.focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByText('2 / 3')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Show Sixth T19 image 3' })
    )
    expect(screen.getByText('3 / 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next image' })).toBeDisabled()
  })

  it('shows a single image without controls', () => {
    render(<ImageGallery lang="en" images={['/a.webp']} alt="Poster" />)

    expect(screen.queryByRole('button', { name: 'Next image' })).toBeNull()
    expect(screen.getByAltText('Poster, image 1 of 1')).toBeInTheDocument()
  })

  it('labels controls in Korean', () => {
    render(
      <ImageGallery lang="ko" images={['/a.webp', '/b.webp']} alt="포스터" />
    )

    expect(screen.getByRole('button', { name: '다음 이미지' })).toBeEnabled()
    expect(
      screen.getByRole('button', { name: '포스터 이미지 2 보기' })
    ).toBeInTheDocument()
    expect(screen.getByAltText('포스터, 이미지 1/2')).toBeInTheDocument()
  })
})
