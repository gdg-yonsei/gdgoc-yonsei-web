import type { Locale } from '@/i18n-config'
import type { FilterBarCopy } from '@/lib/site/filter-state'

/*
 * Copy for the Sessions and Projects pages. Server components read it
 * directly; client islands receive only the strings they need as props
 * (tests/lib/site/client-bundle-guards.test.ts).
 */

export type ArchiveCommonCopy = {
  breadcrumb: string
  home: string
  sessions: string
  projects: string
  members: string
  calendar: string
  generations: string
  noRecords: string
  olderGeneration: string
  newerGeneration: string
  filters: string
  reset: string
}

export const archiveCommonCopy: Record<Locale, ArchiveCommonCopy> = {
  en: {
    breadcrumb: 'Breadcrumb',
    home: 'Home',
    sessions: 'Sessions',
    projects: 'Projects',
    members: 'Members',
    calendar: 'Calendar',
    generations: 'Generations',
    noRecords: 'no public records yet',
    olderGeneration: 'Older generation',
    newerGeneration: 'Newer generation',
    filters: 'Filters',
    reset: 'Reset filters',
  },
  ko: {
    breadcrumb: '이동 경로',
    home: '홈',
    sessions: '세션',
    projects: '프로젝트',
    members: '구성원',
    calendar: '캘린더',
    generations: '기수',
    noRecords: '아직 공개된 기록이 없어요',
    olderGeneration: '이전 기수',
    newerGeneration: '다음 기수',
    filters: '필터',
    reset: '필터 초기화',
  },
}

export type SessionArchiveCopy = {
  tag: string
  hubTitle: string
  hubDescription: string
  generationTitle: string
  generationDescription: string
  countOne: string
  countMany: string
  search: string
  searchPlaceholder: string
  resultOne: string
  resultMany: string
  noResults: string
  emptyTitle: string
  emptyBody: string
  tba: string
  facetCategory: string
  facetPart: string
  facetGeneration: string
  commit: string
  date: string
  time: string
  location: string
  locationFallback: string
  generation: string
  part: string
  type: string
  related: string
  chronology: string
  previous: string
  next: string
}

export const sessionArchiveCopy: Record<Locale, SessionArchiveCopy> = {
  en: {
    tag: '<log />',
    hubTitle: 'Session Log',
    hubDescription:
      'Every public GDGoC Yonsei session in one log: tech talks, part sessions, hackathons and demo days where student developers share what they learn and build.',
    generationTitle: '{generation} Sessions',
    generationDescription:
      'Every public session GDGoC Yonsei ran in {generation}, newest first.',
    countOne: '{count} session',
    countMany: '{count} sessions',
    search: 'Search sessions',
    searchPlaceholder: 'Search by title, part or place',
    resultOne: '{count} session shown',
    resultMany: '{count} sessions shown',
    noResults: 'No sessions match these filters.',
    emptyTitle: 'No public sessions yet',
    emptyBody:
      'Sessions from this generation will appear here once they are published.',
    tba: 'Date to be announced',
    facetCategory: 'Type',
    facetPart: 'Part',
    facetGeneration: 'Generation',
    commit: 'commit',
    date: 'Date',
    time: 'Time (KST)',
    location: 'Location',
    locationFallback: 'To be announced',
    generation: 'Generation',
    part: 'Part',
    type: 'Type',
    related: 'Related sessions',
    chronology: 'Session timeline',
    previous: 'Previous session',
    next: 'Next session',
  },
  ko: {
    tag: '<log />',
    hubTitle: '세션 로그',
    hubDescription:
      'GDGoC Yonsei의 모든 공개 세션을 한곳에 모았어요. 기술 세션, 파트 세션, 해커톤과 데모데이에서 학생 개발자들이 배우고 만든 것을 나눕니다.',
    generationTitle: '{generation} 세션',
    generationDescription:
      'GDGoC Yonsei {generation} 기수의 공개 세션을 최신순으로 보여줘요.',
    countOne: '세션 {count}개',
    countMany: '세션 {count}개',
    search: '세션 검색',
    searchPlaceholder: '제목, 파트, 장소로 검색',
    resultOne: '세션 {count}개 표시 중',
    resultMany: '세션 {count}개 표시 중',
    noResults: '조건에 맞는 세션이 없어요.',
    emptyTitle: '아직 공개된 세션이 없어요',
    emptyBody: '이 기수의 세션이 공개되면 여기에 표시돼요.',
    tba: '일정 미정',
    facetCategory: '유형',
    facetPart: '파트',
    facetGeneration: '기수',
    commit: 'commit',
    date: '날짜',
    time: '시간 (KST)',
    location: '장소',
    locationFallback: '추후 공지',
    generation: '기수',
    part: '파트',
    type: '유형',
    related: '관련 세션',
    chronology: '세션 타임라인',
    previous: '이전 세션',
    next: '다음 세션',
  },
}

export type ProjectArchiveCopy = {
  tag: string
  hubTitle: string
  hubDescription: string
  generationTitle: string
  generationDescription: string
  countOne: string
  countMany: string
  search: string
  searchPlaceholder: string
  resultOne: string
  resultMany: string
  noResults: string
  emptyTitle: string
  emptyBody: string
  facetGeneration: string
  facetStack: string
  facetLinks: string
  demo: string
  source: string
  openSource: string
  team: string
  stack: string
  details: string
  allMembers: string
  links: string
  dates: string
  published: string
  updated: string
  gallery: string
  moreFrom: string
  nextProject: string
}

export const projectArchiveCopy: Record<Locale, ProjectArchiveCopy> = {
  en: {
    tag: '<releases />',
    hubTitle: 'Projects',
    hubDescription:
      'What GDGoC Yonsei members have built and shipped. Filter by generation, tech stack, live demos and open-source code.',
    generationTitle: '{generation} Projects',
    generationDescription:
      'Projects GDGoC Yonsei members built in {generation}.',
    countOne: '{count} project',
    countMany: '{count} projects',
    search: 'Search projects',
    searchPlaceholder: 'Search by name, stack or member',
    resultOne: '{count} project shown',
    resultMany: '{count} projects shown',
    noResults: 'No projects match these filters.',
    emptyTitle: 'No public projects yet',
    emptyBody:
      'Projects from this generation will appear here once they are published.',
    facetGeneration: 'Generation',
    facetStack: 'Tech stack',
    facetLinks: 'Links',
    demo: 'Live demo',
    source: 'Source',
    openSource: 'Open source',
    team: 'Team',
    stack: 'Tech stack',
    details: 'Project details',
    allMembers: 'Meet the {generation} members',
    links: 'Links',
    dates: 'Timeline',
    published: 'Published',
    updated: 'Updated',
    gallery: 'Gallery',
    moreFrom: 'More from {generation}',
    nextProject: 'Next project',
  },
  ko: {
    tag: '<releases />',
    hubTitle: '프로젝트',
    hubDescription:
      'GDGoC Yonsei 멤버들이 만들고 선보인 프로젝트예요. 기수, 기술 스택, 라이브 데모와 오픈 소스 여부로 찾아보세요.',
    generationTitle: '{generation} 프로젝트',
    generationDescription:
      'GDGoC Yonsei {generation} 기수 멤버들이 만든 프로젝트예요.',
    countOne: '프로젝트 {count}개',
    countMany: '프로젝트 {count}개',
    search: '프로젝트 검색',
    searchPlaceholder: '이름, 기술 스택, 멤버로 검색',
    resultOne: '프로젝트 {count}개 표시 중',
    resultMany: '프로젝트 {count}개 표시 중',
    noResults: '조건에 맞는 프로젝트가 없어요.',
    emptyTitle: '아직 공개된 프로젝트가 없어요',
    emptyBody: '이 기수의 프로젝트가 공개되면 여기에 표시돼요.',
    facetGeneration: '기수',
    facetStack: '기술 스택',
    facetLinks: '링크',
    demo: '라이브 데모',
    source: '소스 코드',
    openSource: '오픈 소스',
    team: '팀',
    stack: '기술 스택',
    details: '프로젝트 정보',
    allMembers: '{generation} 멤버 보기',
    links: '링크',
    dates: '기록',
    published: '공개',
    updated: '수정',
    gallery: '갤러리',
    moreFrom: '{generation} 기수의 다른 프로젝트',
    nextProject: '다음 프로젝트',
  },
}

export function sessionFilterCopy(locale: Locale): FilterBarCopy {
  const copy = sessionArchiveCopy[locale]
  const common = archiveCommonCopy[locale]
  return {
    label: common.filters,
    search: copy.search,
    searchPlaceholder: copy.searchPlaceholder,
    resultOne: copy.resultOne,
    resultMany: copy.resultMany,
    noResults: copy.noResults,
    reset: common.reset,
  }
}

export function projectFilterCopy(locale: Locale): FilterBarCopy {
  const copy = projectArchiveCopy[locale]
  const common = archiveCommonCopy[locale]
  return {
    label: common.filters,
    search: copy.search,
    searchPlaceholder: copy.searchPlaceholder,
    resultOne: copy.resultOne,
    resultMany: copy.resultMany,
    noResults: copy.noResults,
    reset: common.reset,
  }
}

export type MemberArchiveCopy = {
  tag: string
  hubTitle: string
  hubDescription: string
  generationTitle: string
  generationDescription: string
  countOne: string
  countMany: string
  partEmpty: string
  emptyTitle: string
  emptyBody: string
  present: string
  email: string
  linkedin: string
  instagram: string
  github: string
}

export const memberArchiveCopy: Record<Locale, MemberArchiveCopy> = {
  en: {
    tag: '<team />',
    hubTitle: 'Members',
    hubDescription:
      'Meet GDGoC Yonsei organizers and members by generation and explore the student community building technology together at Yonsei University.',
    generationTitle: '{generation} Members',
    generationDescription:
      "Meet the GDGoC Yonsei {generation} members across each technical and community team, and discover the people building Yonsei's student developer community.",
    countOne: '{count} member',
    countMany: '{count} members',
    partEmpty: 'No members in this part yet.',
    emptyTitle: 'No members published yet',
    emptyBody: 'Members appear here once the generation is published.',
    present: 'Present',
    email: 'Email',
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
    github: 'GitHub',
  },
  ko: {
    tag: '<team />',
    hubTitle: '구성원',
    hubDescription:
      '기수별 GDGoC Yonsei 운영진과 구성원을 만나고 연세대학교에서 함께 기술을 만드는 학생 개발자 커뮤니티를 확인하세요.',
    generationTitle: '{generation} 구성원',
    generationDescription:
      'GDGoC Yonsei {generation} 기수의 파트별 구성원과 학생 개발자 프로필을 확인하고 연세대학교 개발자 커뮤니티의 활동 분야를 만나보세요.',
    countOne: '{count}명',
    countMany: '{count}명',
    partEmpty: '아직 이 파트에 등록된 구성원이 없어요.',
    emptyTitle: '아직 공개된 구성원이 없어요',
    emptyBody: '기수가 공개되면 구성원이 여기에 표시돼요.',
    present: '현재',
    email: '이메일',
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
    github: 'GitHub',
  },
}
