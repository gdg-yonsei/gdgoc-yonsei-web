import type { Locale } from '@/lib/i18n'
import { chromeCopy, type ChromeCopy } from '@/lib/contents/site-copy'
import { localeHref } from '@/lib/site/routes'

export type HeaderNavigationLink = {
  href: string
  label: string
  prefetch?: boolean

  utility?: boolean
}

/** GYMS는 로그인과 무거운 응답이 필요해 prefetch를 끈다. */
export function getHeaderNavigationLinks(lang: Locale): HeaderNavigationLink[] {
  const copy = chromeCopy[lang]

  return [
    {
      href: localeHref(lang, '/session'),
      label: copy.sessions,
      prefetch: true,
    },
    {
      href: localeHref(lang, '/project'),
      label: copy.projects,
      prefetch: true,
    },
    {
      href: localeHref(lang, '/calendar'),
      label: copy.calendar,
      prefetch: true,
    },
    { href: localeHref(lang, '/member'), label: copy.members, prefetch: true },
    {
      href: localeHref(lang, '/admin'),
      label: 'GYMS',
      prefetch: false,
      utility: true,
    },
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

/** 클라이언트 내비게이션에 필요한 문구만 서버에서 골라 넘긴다(사전 전체가 번들에 들어가지 않게). */
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
