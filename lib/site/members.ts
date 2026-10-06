import type { Locale } from '@/lib/i18n'
import { formatUserName } from '@/lib/format/user-name'

export type MemberProfile = {
  id: string
  name: string
  email: string
  image: string | null
  firstName: string | null
  firstNameKo: string | null
  lastName: string | null
  lastNameKo: string | null
  githubId: string | null
  instagramId: string | null
  linkedInId: string | null
  isForeigner: boolean
}

/** 한국어 페이지는 한글 이름이 있으면 한글 이름(성 먼저)을 쓴다. */
export function memberName(user: MemberProfile, lang: Locale): string {
  if (lang === 'ko' && user.firstNameKo) {
    return formatUserName(
      user.name,
      user.firstNameKo,
      user.lastNameKo,
      user.isForeigner,
      true
    )
  }
  return formatUserName(
    user.name,
    user.firstName,
    user.lastName,
    user.isForeigner
  )
}

export type MemberLinkKind = 'email' | 'linkedin' | 'instagram' | 'github'

export type MemberLink = { kind: MemberLinkKind; href: string }

/** `@minji`, `minji`, 붙여 넣은 프로필 URL(하위 도메인, 끝 슬래시, 쿼리 포함) → `minji` */
function handle(value: string, profilePath: RegExp): string {
  return value
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(profilePath, '')
    .replace(/^@/, '')
    .replace(/[/?#].*$/, '')
}

const PROFILES: ReadonlyArray<{
  kind: Exclude<MemberLinkKind, 'email'>
  field: 'linkedInId' | 'instagramId' | 'githubId'
  path: RegExp
  base: string
}> = [
  {
    kind: 'linkedin',
    field: 'linkedInId',
    path: /^([a-z0-9-]+\.)?linkedin\.com\/in\//i,
    base: 'https://www.linkedin.com/in/',
  },
  {
    kind: 'instagram',
    field: 'instagramId',
    path: /^([a-z0-9-]+\.)?instagram\.com\//i,
    base: 'https://www.instagram.com/',
  },
  {
    kind: 'github',
    field: 'githubId',
    path: /^([a-z0-9-]+\.)?github\.com\//i,
    base: 'https://github.com/',
  },
]

// 아이디·@아이디·프로필 URL을 정규화하고 이메일, LinkedIn, Instagram, GitHub 순서로 반환한다.
export function memberLinks(user: MemberProfile): MemberLink[] {
  const links: MemberLink[] = []
  if (user.email) {
    links.push({ kind: 'email', href: `mailto:${user.email}` })
  }
  for (const { kind, field, path, base } of PROFILES) {
    const value = user[field]
    const name = value ? handle(value, path) : ''
    if (name) links.push({ kind, href: `${base}${name}` })
  }
  return links
}
