/**
 * 헤더 내비게이션 링크와 문구를 만드는 서버 측 헬퍼. 결과는 클라이언트 내비게이션에 props로 넘긴다.
 */
import type { Locale } from '@/lib/i18n'
import { chromeCopy, type ChromeCopy } from '@/lib/contents/site-copy'

/** 헤더 링크 하나. */
export type HeaderNavigationLink = {
  href: string
  label: string
  prefetch?: boolean
  /** 멤버 전용 도구(GYMS) 링크. 덜 눈에 띄게 그리고 prefetch하지 않는다. */
  utility?: boolean
}

/**
 * 헤더 링크 목록: 세션, 프로젝트, 캘린더, 멤버, GYMS(관리자).
 *
 * GYMS는 로그인이 필요하고 응답이 무거워 prefetch를 끈다.
 */
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

/** 내비게이션에 필요한 문구 부분집합. */
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
