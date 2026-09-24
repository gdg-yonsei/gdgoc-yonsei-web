import { describe, expect, it } from 'vitest'
import { memberLinks, memberName, type MemberProfile } from '@/lib/site/members'

const member = (overrides: Partial<MemberProfile> = {}): MemberProfile => ({
  id: 'u1',
  name: 'minji-kim',
  email: 'minji@example.com',
  image: null,
  firstName: 'Minji',
  firstNameKo: '민지',
  lastName: 'Kim',
  lastNameKo: '김',
  githubId: null,
  instagramId: null,
  linkedInId: null,
  isForeigner: false,
  ...overrides,
})

describe('memberName', () => {
  it('uses the Korean name on Korean pages and falls back to English', () => {
    expect(memberName(member(), 'ko')).toBe('김민지')
    expect(memberName(member({ firstNameKo: null }), 'ko')).toBe('Kim Minji')
    expect(memberName(member(), 'en')).toBe('Kim Minji')
  })

  it('falls back to the username when no real name is set', () => {
    expect(
      memberName(member({ firstName: null, firstNameKo: null }), 'en')
    ).toBe('minji-kim')
  })
})

describe('memberLinks', () => {
  it('normalises profile links however they were typed', () => {
    expect(
      memberLinks(
        member({
          linkedInId: 'https://www.linkedin.com/in/minji/',
          instagramId: '@minji.codes',
          githubId: '@minji',
        })
      )
    ).toEqual([
      { kind: 'email', href: 'mailto:minji@example.com' },
      { kind: 'linkedin', href: 'https://www.linkedin.com/in/minji' },
      { kind: 'instagram', href: 'https://www.instagram.com/minji.codes' },
      { kind: 'github', href: 'https://github.com/minji' },
    ])
  })

  it('accepts pasted profile URLs, not only handles', () => {
    expect(
      memberLinks(
        member({
          email: '',
          linkedInId: 'https://kr.linkedin.com/in/minji-kim-123/',
          instagramId: 'https://www.instagram.com/minji.codes/?igsh=abc',
          githubId: 'github.com/minji',
        })
      )
    ).toEqual([
      { kind: 'linkedin', href: 'https://www.linkedin.com/in/minji-kim-123' },
      { kind: 'instagram', href: 'https://www.instagram.com/minji.codes' },
      { kind: 'github', href: 'https://github.com/minji' },
    ])
  })

  it('skips a link whose handle is empty once normalised', () => {
    expect(
      memberLinks(member({ email: '', instagramId: 'https://instagram.com/' }))
    ).toEqual([])
  })
})
