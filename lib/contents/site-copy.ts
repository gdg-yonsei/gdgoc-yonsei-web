import type { Locale } from '@/i18n-config'

export type ChromeCopy = {
  skipToContent: string
  home: string
  primaryNav: string
  mobileNav: string
  menu: string
  openMenu: string
  closeMenu: string
  loadingMenu: string
  language: string
  sessions: string
  projects: string
  calendar: string
  members: string
  footerBlurb: string
  footerExplore: string
  footerConnect: string
  footerSite: string
  chapterPage: string
  privacy: string
  terms: string
  freshmanOt: string
  source: string
  gyms: string
  clockLabel: string
}

export const chromeCopy: Record<Locale, ChromeCopy> = {
  en: {
    skipToContent: 'Skip to content',
    home: 'GDGoC Yonsei home',
    primaryNav: 'Primary navigation',
    mobileNav: 'Mobile primary navigation',
    menu: 'Menu',
    openMenu: 'Open navigation menu',
    closeMenu: 'Close navigation menu',
    loadingMenu: 'Loading navigation',
    language: 'Language',
    sessions: 'Sessions',
    projects: 'Projects',
    calendar: 'Calendar',
    members: 'Members',
    footerBlurb:
      "GDG on Campus Yonsei — Yonsei University's student developer community in Sinchon, Seoul.",
    footerExplore: 'Explore',
    footerConnect: 'Connect',
    footerSite: 'Site',
    chapterPage: 'Official GDG chapter',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    freshmanOt: '2026 Freshman Orientation',
    source: 'Source code',
    gyms: 'GYMS for members',
    clockLabel: 'Sinchon, Seoul',
  },
  ko: {
    skipToContent: '본문 바로가기',
    home: 'GDGoC Yonsei 홈',
    primaryNav: '주 메뉴',
    mobileNav: '모바일 주 메뉴',
    menu: '메뉴',
    openMenu: '탐색 메뉴 열기',
    closeMenu: '탐색 메뉴 닫기',
    loadingMenu: '탐색 메뉴 로딩 중',
    language: '언어',
    sessions: '세션',
    projects: '프로젝트',
    calendar: '캘린더',
    members: '구성원',
    footerBlurb:
      '연세대학교 신촌캠퍼스의 학생 개발자 커뮤니티, GDG on Campus Yonsei입니다.',
    footerExplore: '둘러보기',
    footerConnect: '연결',
    footerSite: '사이트',
    chapterPage: '공식 GDG 챕터 페이지',
    privacy: '개인정보처리방침',
    terms: '이용약관',
    freshmanOt: '2026 신입생 OT',
    source: '소스 코드',
    gyms: '멤버 전용 GYMS',
    clockLabel: '서울 신촌',
  },
}

type HeroCopy = {
  eyebrow: string
  tagline: string
  primaryCta: string
  secondaryCta: string
  metaLabel: string
  meta: [string, string, string]
  scrollCue: string
}

export const heroCopy: Record<Locale, HeroCopy> = {
  en: {
    eyebrow: 'Google Developer Groups on Campus · Yonsei University',
    tagline:
      "Yonsei University's student developer community. We connect, learn, and grow — then ship what we build.",
    primaryCta: 'Explore sessions',
    secondaryCta: 'See projects',
    metaLabel: 'At a glance',
    meta: ['T19 · Tue 19:00 KST', '6 parts', 'Sinchon, Seoul'],
    scrollCue: 'Scroll to open',
  },
  ko: {
    eyebrow: 'Google Developer Groups on Campus · 연세대학교',
    tagline:
      '연세대학교 학생 개발자 커뮤니티. 함께 연결하고, 배우고, 성장하며 — 만든 것을 세상에 내놓습니다.',
    primaryCta: '세션 둘러보기',
    secondaryCta: '프로젝트 보기',
    metaLabel: '한눈에 보기',
    meta: ['T19 · 매주 화 19:00', '6개 파트', '서울 신촌'],
    scrollCue: '스크롤해서 열기',
  },
}
