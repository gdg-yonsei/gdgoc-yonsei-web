import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NavigationButton from '@/app/components/navigation-button'
import GenerationButtonGroup from '@/app/components/generation-button-group'
import LoadingSpinner from '@/app/components/loading-spinner'
import PageTitle from '@/app/components/page-title'
import ShowMoreContent from '@/app/components/show-more-content'
import UserProfileImage from '@/app/components/user-profile-image'
import UserProfileImagePreview from '@/app/components/user-profile-image-preview'
import Footer from '@/app/components/footer'

describe('common components', () => {
  it('renders navigation button link', () => {
    render(<NavigationButton href="/ko/project">Back</NavigationButton>)

    const link = screen.getByRole('link', { name: /Back/i })
    expect(link).toHaveAttribute('href', '/ko/project')
  })

  it('renders generation button group links', () => {
    render(
      <GenerationButtonGroup
        generationList={['10th', '11th']}
        generation={'11th'}
        lang={'ko'}
        basePath={'project'}
      />
    )

    expect(screen.getByRole('link', { name: '10th' })).toHaveAttribute(
      'href',
      '/ko/project/10th'
    )
    expect(screen.getByRole('link', { name: '11th' })).toHaveClass(
      'border-green-700'
    )
  })

  it('renders loading spinner with default and custom className', () => {
    const { container, rerender } = render(<LoadingSpinner />)
    expect(container.firstChild).toHaveClass('animate-spin')

    rerender(<LoadingSpinner className="size-2 border" />)
    expect(container.firstChild).toHaveClass('size-2')
    expect(container.firstChild).toHaveClass('border')
  })

  it('renders page title', () => {
    render(<PageTitle>Dashboard</PageTitle>)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Dashboard' })
    ).toBeInTheDocument()
  })

  it('reveals show more content state on click', async () => {
    const user = userEvent.setup()
    render(<ShowMoreContent>More Content</ShowMoreContent>)

    const button = screen.getByRole('button', { name: 'Show More' })
    await user.click(button)

    expect(button).toHaveClass('hidden')
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
    render(<Footer />)

    expect(
      screen.getByRole('link', { name: /gdsc\.yonsei\.univ@gmail\.com/i })
    ).toHaveAttribute('href', 'mailto:gdsc.yonsei.univ@gmail.com')
    expect(
      screen.getByRole('link', { name: /go to LinkedIn/i })
    ).toHaveAttribute('href', 'https://www.linkedin.com/company/gdsc-yonsei/')
    expect(
      screen.getByRole('link', { name: /@gdg\.yonseiuniv/i })
    ).toHaveAttribute('href', 'https://www.instagram.com/gdg.yonseiuniv/')
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
