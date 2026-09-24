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
  schedule: string
  sessionsOne: string
  sessionsMany: string
  projectsOne: string
  projectsMany: string
  generationsOne: string
  generationsMany: string
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
    schedule: 'T19 · Tue 19:00 KST',
    sessionsOne: '{count} session',
    sessionsMany: '{count} sessions',
    projectsOne: '{count} project',
    projectsMany: '{count} projects',
    generationsOne: '{count} generation',
    generationsMany: '{count} generations',
    scrollCue: 'Scroll to open',
  },
  ko: {
    eyebrow: 'Google Developer Groups on Campus · 연세대학교',
    tagline:
      '연세대학교 학생 개발자 커뮤니티. 함께 연결하고, 배우고, 성장하며 — 만든 것을 세상에 내놓습니다.',
    primaryCta: '세션 둘러보기',
    secondaryCta: '프로젝트 보기',
    metaLabel: '한눈에 보기',
    schedule: 'T19 · 매주 화 19:00',
    sessionsOne: '세션 {count}개',
    sessionsMany: '세션 {count}개',
    projectsOne: '프로젝트 {count}개',
    projectsMany: '프로젝트 {count}개',
    generationsOne: '{count}개 기수',
    generationsMany: '{count}개 기수',
    scrollCue: '스크롤해서 열기',
  },
}

export type ProgramKey =
  | 'T19'
  | 'Part Session'
  | 'oTP'
  | 'Solution Challenge'
  | 'Yonsei X Korea Demo Day'
  | 'The Bridge Hackathon'

export type LandingCopy = {
  manifesto: {
    tag: string
    title: string
    statement: string
    asideTitle: string
    asideLink: string
    pillars: { key: 'community' | 'tech' | 'growth'; title: string }[]
  }
  programs: {
    tag: string
    title: string
    intro: string
    titles: Record<ProgramKey, string>
    kickers: Record<ProgramKey, string>
  }
  funnel: { caption: string; steps: { value: string; label: string }[] }
  parts: { tag: string; title: string; intro: string; partLink: string }
  log: { tag: string; title: string; link: string }
  releases: { tag: string; title: string; link: string }
  join: {
    tag: string
    title: string
    lead: string
    instagram: string
    linkedin: string
    calendar: string
  }
}

/*
 * Landing copy. Facts (the T19 schedule, the six parts, program names and
 * the 2023 Solution Challenge numbers) come from lib/contents/*; nothing
 * here promises dates the chapter hasn't announced.
 */
export const landingCopy: Record<Locale, LandingCopy> = {
  en: {
    manifesto: {
      tag: '<about />',
      title: 'What is GDGoC Yonsei?',
      statement:
        'A student developer community at Yonsei University. We connect, learn and grow together, and turn what we learn into work our community can use.',
      asideTitle: 'What is GDG on Campus?',
      asideLink: 'The official GDG chapter',
      pillars: [
        { key: 'community', title: 'Community' },
        { key: 'tech', title: 'Tech' },
        { key: 'growth', title: 'Sustainable Growth' },
      ],
    },
    programs: {
      tag: '<programs />',
      title: 'Programs',
      intro: 'How members learn, build and share, week after week.',
      titles: {
        T19: 'T19',
        'Part Session': 'Part Sessions',
        oTP: 'oTP → Demo Day',
        'Solution Challenge': 'Solution Challenge',
        'Yonsei X Korea Demo Day': 'Yonsei × Korea Demo Day',
        'The Bridge Hackathon': 'The Bridge Hackathon',
      },
      kickers: {
        T19: 'Every Tuesday · 19:00 KST',
        'Part Session': 'Six parts · studies and workshops',
        oTP: 'Open Tech Project',
        'Solution Challenge': 'Google for Developers',
        'Yonsei X Korea Demo Day': 'With GDGoC Korea',
        'The Bridge Hackathon': 'Yonsei · Korea · Tokyo · Waseda',
      },
    },
    funnel: {
      caption: 'Solution Challenge 2023',
      steps: [
        { value: '2,100', label: 'teams worldwide' },
        { value: '6', label: 'teams from GDG Yonsei' },
        { value: '3', label: 'in the Top 100' },
        { value: '1', label: 'Top 10 finalist' },
      ],
    },
    parts: {
      tag: '<parts />',
      title: 'Six parts',
      intro:
        'Every member joins a part: a small team that studies, runs workshops and builds together.',
      partLink: '{part} sessions',
    },
    log: {
      tag: '<log />',
      title: 'Latest sessions',
      link: 'Open the Session Log',
    },
    releases: {
      tag: '<releases />',
      title: 'Latest projects',
      link: 'See all projects',
    },
    join: {
      tag: '<join />',
      title: 'Build with us',
      lead: 'Recruiting news goes out on Instagram first.',
      instagram: 'Follow on Instagram',
      linkedin: 'LinkedIn',
      calendar: 'See the calendar',
    },
  },
  ko: {
    manifesto: {
      tag: '<about />',
      title: 'GDGoC Yonsei는 어떤 커뮤니티인가요?',
      statement:
        '연세대학교의 학생 개발자 커뮤니티. 함께 연결하고 배우고 성장하며, 배운 것을 우리 공동체가 쓸 수 있는 결과물로 만듭니다.',
      asideTitle: 'GDG on Campus란 무엇인가요?',
      asideLink: '공식 GDG 챕터 페이지',
      pillars: [
        { key: 'community', title: '커뮤니티' },
        { key: 'tech', title: '기술' },
        { key: 'growth', title: '지속 가능한 성장' },
      ],
    },
    programs: {
      tag: '<programs />',
      title: '프로그램',
      intro: '매주 배우고, 만들고, 나누는 방식이에요.',
      titles: {
        T19: 'T19',
        'Part Session': '파트 세션',
        oTP: 'oTP → 데모데이',
        'Solution Challenge': 'Solution Challenge',
        'Yonsei X Korea Demo Day': 'Yonsei × Korea Demo Day',
        'The Bridge Hackathon': 'The Bridge Hackathon',
      },
      kickers: {
        T19: '매주 화요일 · 19:00',
        'Part Session': '6개 파트 · 스터디와 워크숍',
        oTP: 'Open Tech Project',
        'Solution Challenge': 'Google for Developers',
        'Yonsei X Korea Demo Day': 'GDGoC Korea와 함께',
        'The Bridge Hackathon': '연세 · 고려 · 도쿄 · 와세다',
      },
    },
    funnel: {
      caption: 'Solution Challenge 2023',
      steps: [
        { value: '2,100', label: '전 세계 참가 팀' },
        { value: '6', label: 'GDG Yonsei 참가 팀' },
        { value: '3', label: 'Top 100 선정' },
        { value: '1', label: 'Top 10 파이널리스트' },
      ],
    },
    parts: {
      tag: '<parts />',
      title: '6개 파트',
      intro: '모든 멤버는 파트에 속해 함께 공부하고, 워크숍을 열고, 만들어요.',
      partLink: '{part} 세션',
    },
    log: {
      tag: '<log />',
      title: '최근 세션',
      link: '세션 로그 열기',
    },
    releases: {
      tag: '<releases />',
      title: '최근 프로젝트',
      link: '모든 프로젝트 보기',
    },
    join: {
      tag: '<join />',
      title: '함께 만들어요',
      lead: '모집 소식은 인스타그램에 가장 먼저 올라와요.',
      instagram: '인스타그램 팔로우',
      linkedin: 'LinkedIn',
      calendar: '캘린더 보기',
    },
  },
}
