import type { Locale } from '@/i18n-config'
import formatUserName from '@/lib/format-user-name'

/** The member columns the public directory selects (lib/server/queries/public/members.ts). */
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

/** Korean pages use the Korean name (family name first) when one is set. */
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

/** `@minji`, `minji` or a pasted profile URL (any subdomain, trailing slash,
    query) → `minji`. */
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

/** Profile links in a fixed order, normalised from however they were typed:
    a handle, `@handle` or a pasted profile URL. */
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
