import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/lib/hooks/use-reduced-motion', () => ({
  useReducedMotion: () => false,
}))
vi.mock('next/navigation', () => ({
  usePathname: () => '/en/project',
}))
import LoadingSpinner from '@/app/components/loading-spinner'
import UserProfileImage from '@/app/components/user-profile-image'
import UserProfileImagePreview from '@/app/components/user-profile-image-preview'
import Footer from '@/app/components/footer'

describe('common components', () => {
  it('renders loading spinner with default and custom className', () => {
    const { container, rerender } = render(<LoadingSpinner />)
    expect(container.firstChild).toHaveClass('animate-spin')

    rerender(<LoadingSpinner className="size-2 border" />)
    expect(container.firstChild).toHaveClass('size-2')
    expect(container.firstChild).toHaveClass('border')
  })

  it('builds user profile image src by the given rules', () => {
    process.env.NEXT_PUBLIC_IMAGE_URL = 'https://cdn.example.com'

    const { rerender } = render(
      <UserProfileImage
        src={'/users/a.png'}
        alt={'profile'}
        width={100}
        height={100}
        className={'rounded'}
      />
    )

    expect(screen.getByAltText('profile')).toHaveAttribute(
      'src',
      'https://cdn.example.com/users/a.png'
    )

    rerender(
      <UserProfileImage
        src={'https://images.example.com/a.png'}
        alt={'profile'}
        width={100}
        height={100}
        className={'rounded'}
      />
    )

    expect(screen.getByAltText('profile')).toHaveAttribute(
      'src',
      'https://images.example.com/a.png'
    )

    rerender(
      <UserProfileImage
        src={null}
        alt={'profile'}
        width={100}
        height={100}
        className={'rounded'}
      />
    )

    expect(screen.getByAltText('profile')).toHaveAttribute(
      'src',
      '/default-user-profile.png'
    )
  })

  it('renders preview image with fallback', () => {
    const { rerender } = render(
      <UserProfileImagePreview
        src={null}
        alt={'preview'}
        width={100}
        height={100}
        className={'rounded'}
      />
    )

    expect(screen.getByAltText('preview')).toHaveAttribute(
      'src',
      '/default-user-profile.png'
    )

    rerender(
      <UserProfileImagePreview
        src={'/uploaded.png'}
        alt={'preview'}
        width={100}
        height={100}
        className={'rounded'}
      />
    )

    expect(screen.getByAltText('preview')).toHaveAttribute(
      'src',
      '/uploaded.png'
    )
  })

  it('renders footer links', () => {
    render(<Footer lang="en" />)

    const mailLink = screen.getByRole('link', {
      name: 'Email GDGoC Yonsei',
    })
    const linkedInLink = screen.getByRole('link', {
      name: 'GDGoC Yonsei LinkedIn',
    })
    const instagramLink = screen.getByRole('link', {
      name: 'GDGoC Yonsei Instagram',
    })

    expect(mailLink).toHaveAttribute(
      'href',
      'mailto:gdsc.yonsei.univ@gmail.com'
    )
    expect(mailLink).toHaveAttribute('rel', 'noreferrer noopener')
    expect(linkedInLink).toHaveAttribute(
      'href',
      'https://www.linkedin.com/company/gdsc-yonsei/'
    )
    expect(linkedInLink).toHaveAttribute('rel', 'noreferrer noopener')
    expect(instagramLink).toHaveAttribute(
      'href',
      'https://www.instagram.com/gdg.yonseiuniv/'
    )
    expect(instagramLink).toHaveAttribute('rel', 'noreferrer noopener')
    expect(
      screen.getAllByRole('link', { name: /한국어/ }).at(-1)
    ).toHaveAttribute('href', '/ko/project')
    expect(
      screen.getByRole('link', { name: '2026 Freshman Orientation' })
    ).toHaveAttribute('href', '/en/2026-freshman-ot')
  })

  it('draws footer link arrows as icons, not glyphs outside the Latin font subset', () => {
    // A text "↗" (U+2197) makes the browser fetch Google Sans Flex's symbols
    // subset on every page just for the footer.
    const { container } = render(<Footer lang="en" />)
    expect(container.textContent).not.toMatch(/[\u2190-\u21ff]/)
  })

  it('supports back-to-page behavior from next router', async () => {
    const back = vi.fn()
    vi.doMock('next/navigation', () => ({
      useRouter: () => ({ back }),
    }))

    const { default: BackToPageButton } =
      await import('@/app/components/back-to-page-button')

    const user = userEvent.setup()
    render(<BackToPageButton />)

    await user.click(
      screen.getByRole('button', { name: 'Go back to the previous page' })
    )

    expect(back).toHaveBeenCalledTimes(1)

    vi.resetModules()
  })
})
