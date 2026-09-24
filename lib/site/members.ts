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

/** Profile links in a fixed order, normalised from however they were typed. */
export function memberLinks(user: MemberProfile): MemberLink[] {
  const links: MemberLink[] = []
  if (user.email) {
    links.push({ kind: 'email', href: `mailto:${user.email}` })
  }
  if (user.linkedInId) {
    const handle = user.linkedInId
      .replace(/^https?:\/\//, '')
      .replace(/^(www\.)?linkedin\.com\/in\//, '')
      .replace(/\/+$/, '')
    links.push({
      kind: 'linkedin',
      href: `https://www.linkedin.com/in/${handle}`,
    })
  }
  if (user.instagramId) {
    links.push({
      kind: 'instagram',
      href: `https://www.instagram.com/${user.instagramId.replace(/^@/, '')}`,
    })
  }
  if (user.githubId) {
    links.push({
      kind: 'github',
      href: `https://github.com/${user.githubId.replace(/^@/, '')}`,
    })
  }
  return links
}
