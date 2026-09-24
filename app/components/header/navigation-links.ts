import type { Locale } from '@/i18n-config'
import { chromeCopy, type ChromeCopy } from '@/lib/contents/site-copy'

export type HeaderNavigationLink = {
  href: string
  label: string
  prefetch?: boolean
  /** Members-only utility (GYMS): rendered quieter and never prefetched. */
  utility?: boolean
}

export function getHeaderNavigationLinks(lang: Locale): HeaderNavigationLink[] {
  const copy = chromeCopy[lang]

  return [
    { href: `/${lang}/session`, label: copy.sessions, prefetch: true },
    { href: `/${lang}/project`, label: copy.projects, prefetch: true },
    { href: `/${lang}/calendar`, label: copy.calendar, prefetch: true },
    { href: `/${lang}/member`, label: copy.members, prefetch: true },
    { href: `/${lang}/admin`, label: 'GYMS', prefetch: false, utility: true },
  ]
}

export type HeaderNavigationCopy = Pick<
  ChromeCopy,
  | 'primaryNav'
  | 'mobileNav'
  | 'menu'
  | 'openMenu'
  | 'closeMenu'
  | 'loadingMenu'
  | 'language'
>

/** The few strings the client navigation needs, picked on the server. */
export function getHeaderNavigationCopy(lang: Locale): HeaderNavigationCopy {
  const {
    primaryNav,
    mobileNav,
    menu,
    openMenu,
    closeMenu,
    loadingMenu,
    language,
  } = chromeCopy[lang]

  return {
    primaryNav,
    mobileNav,
    menu,
    openMenu,
    closeMenu,
    loadingMenu,
    language,
  }
}
