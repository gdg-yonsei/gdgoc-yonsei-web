import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import MemberCard from '@/app/components/site/member-card'
import { memberArchiveCopy } from '@/lib/contents/archive-copy'
import type { MemberProfile } from '@/lib/site/members'

const member = (overrides: Partial<MemberProfile> = {}): MemberProfile => ({
  id: 'u1',
  name: 'minji-kim',
  email: 'minji@example.com',
  image: null,
  firstName: 'Minji',
  firstNameKo: '민지',
  lastName: 'Kim',
  lastNameKo: '김',
  githubId: '@minji',
  instagramId: null,
  linkedInId: null,
  isForeigner: false,
  ...overrides,
})

function renderCard(user: MemberProfile, lang: 'en' | 'ko' = 'en') {
  return render(
    <ul>
      <MemberCard user={user} lang={lang} copy={memberArchiveCopy[lang]} />
    </ul>
  )
}

describe('MemberCard', () => {
  it('shows initials without a photo and names every icon link', () => {
    const { container } = renderCard(member())

    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText('KM')).toHaveAttribute('aria-hidden', 'true')
    expect(
      screen.getByRole('link', { name: 'GitHub · Kim Minji' })
    ).toHaveAttribute('rel', 'noreferrer noopener')
    expect(
      screen.getByRole('link', { name: 'Email · Kim Minji' })
    ).not.toHaveAttribute('target')
  })

  it('uses a decorative photo next to the Korean name', () => {
    const { container } = renderCard(
      member({ image: 'https://avatars.githubusercontent.com/u/1' }),
      'ko'
    )

    expect(container.querySelector('img')).toHaveAttribute('alt', '')
    expect(screen.getByText('김민지')).toBeInTheDocument()
  })

  it('leaves out the link list when there is nothing to link', () => {
    const { container } = renderCard(member({ email: '', githubId: null }))
    expect(container.querySelector('.member-links')).toBeNull()
    expect(screen.queryByRole('link')).toBeNull()
  })
})
