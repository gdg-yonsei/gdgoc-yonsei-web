/**
 * 구조화 데이터(JSON-LD, schema.org) 생성기(순수 함수).
 *
 * 검색 엔진이 페이지 내용을 이해하도록 `<script type="application/ld+json">`에 넣을 객체를
 * 만든다. 호출부가 절대 URL을 넘긴다(`lib/seo/metadata.ts`).
 */
import type { Locale } from '@/lib/i18n'
import { toKstIso } from '@/lib/format/datetime'
import { CHANNELS } from '@/lib/site/channels'

const CONTEXT = 'https://schema.org'

/** 브레드크럼 한 칸(이름, 절대 URL). */
export type JsonLdCrumb = { name: string; url: string }

/** 주최 단체 참조. */
export type JsonLdOrganization = { id: string; name: string; url: string }

/** 브레드크럼 목록(BreadcrumbList). */
export function breadcrumbList(crumbs: readonly JsonLdCrumb[]) {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  }
}

/** 목록 페이지(CollectionPage)와 항목 목록(ItemList). */
export function collectionPage({
  url,
  name,
  description,
  locale,
  websiteId,
  items,
}: {
  url: string
  name: string
  description: string
  locale: Locale
  websiteId: string
  items: readonly JsonLdCrumb[]
}) {
  return [
    {
      '@context': CONTEXT,
      '@type': 'CollectionPage',
      '@id': `${url}#collection-page`,
      url,
      name,
      description,
      inLanguage: locale,
      isPartOf: { '@id': websiteId },
    },
    {
      '@context': CONTEXT,
      '@type': 'ItemList',
      '@id': `${url}#items`,
      name,
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        url: item.url,
      })),
    },
  ] as const
}

/** 세션 장소 주소(연세대학교 신촌캠퍼스). */
export const YONSEI_ADDRESS = {
  '@type': 'PostalAddress',
  streetAddress: '50 Yonsei-ro',
  addressLocality: 'Seodaemun-gu',
  addressRegion: 'Seoul',
  postalCode: '03722',
  addressCountry: 'KR',
} as const

type CommonWork = {
  url: string
  name: string
  description: string
  images: readonly string[]
  locale: Locale
}

/** 세션을 행사(Event)로 표현한다. */
export function sessionEvent({
  url,
  name,
  description,
  images,
  locale,
  startAt,
  endAt,
  location,
  organizer,
}: CommonWork & {
  startAt: Date
  endAt: Date | null
  location: string | null
  organizer: JsonLdOrganization
}) {
  return {
    '@context': CONTEXT,
    '@type': 'Event',
    '@id': `${url}#event`,
    url,
    name,
    description,
    image: images,
    inLanguage: locale,
    startDate: toKstIso(startAt),
    ...(endAt ? { endDate: toKstIso(endAt) } : {}),
    // Google은 EventScheduled를 "예정대로 열림"으로 해석한다. EventCompleted는
    // 유효한 EventStatusType이 아니다.
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    isAccessibleForFree: true,
    location: {
      '@type': 'Place',
      name: location || 'Yonsei University',
      address: YONSEI_ADDRESS,
    },
    organizer: {
      '@type': 'Organization',
      '@id': organizer.id,
      name: organizer.name,
      url: organizer.url,
    },
  }
}

/** 세션 자료를 학습 자료(LearningResource)로 표현한다. */
export function sessionLearningResource({
  url,
  name,
  description,
  images,
  locale,
  providerId,
}: CommonWork & { providerId: string }) {
  return {
    '@context': CONTEXT,
    '@type': 'LearningResource',
    '@id': `${url}#learning-resource`,
    url,
    name,
    description,
    image: images,
    inLanguage: locale,
    provider: { '@id': providerId },
  }
}

/** 프로젝트를 창작물(CreativeWork)로 표현한다. */
export function projectWork({
  url,
  name,
  description,
  images,
  locale,
  dateCreated,
  dateModified,
  keywords,
  creators,
  repoUrl,
  publisherId,
}: CommonWork & {
  dateCreated: Date
  dateModified: Date
  keywords: readonly string[]
  creators: readonly string[]
  repoUrl: string | null
  publisherId: string
}) {
  return {
    '@context': CONTEXT,
    '@type': repoUrl ? ['CreativeWork', 'SoftwareSourceCode'] : 'CreativeWork',
    '@id': `${url}#creative-work`,
    url,
    name,
    description,
    image: images,
    inLanguage: locale,
    dateCreated: dateCreated.toISOString(),
    dateModified: dateModified.toISOString(),
    ...(keywords.length > 0 ? { keywords: keywords.join(', ') } : {}),
    ...(repoUrl ? { codeRepository: repoUrl } : {}),
    creator: creators.map((creator) => ({ '@type': 'Person', name: creator })),
    publisher: { '@id': publisherId },
  }
}

/**
 * 홈 화면 구조화 데이터: 단체(Organization), 사이트(WebSite), 홈 페이지(WebPage).
 * 다른 페이지의 JSON-LD는 여기서 만든 `#organization`, `#website` ID를 참조한다.
 */
export function homeStructuredData({
  siteRoot,
  englishHomeUrl,
  logoUrl,
  canonical,
  locale,
  title,
  description,
}: {
  siteRoot: string
  englishHomeUrl: string
  logoUrl: string
  canonical: string
  locale: Locale
  title: string
  description: string
}) {
  const organizationId = `${siteRoot}#organization`
  const websiteId = `${siteRoot}#website`

  return [
    {
      '@context': CONTEXT,
      '@type': 'Organization',
      '@id': organizationId,
      name: 'GDGoC Yonsei',
      alternateName: [
        'Google Developer Group on Campus Yonsei University',
        'GDSC Yonsei',
      ],
      url: englishHomeUrl,
      logo: logoUrl,
      email: CHANNELS.email,
      sameAs: [CHANNELS.chapter, CHANNELS.linkedin, CHANNELS.instagram],
      parentOrganization: {
        '@type': 'CollegeOrUniversity',
        name: 'Yonsei University',
        url: 'https://www.yonsei.ac.kr/',
      },
    },
    {
      '@context': CONTEXT,
      '@type': 'WebSite',
      '@id': websiteId,
      name: 'GDGoC Yonsei',
      url: siteRoot,
      inLanguage: ['en', 'ko'],
      publisher: { '@id': organizationId },
    },
    {
      '@context': CONTEXT,
      '@type': 'WebPage',
      '@id': `${canonical}#webpage`,
      url: canonical,
      name: title,
      description,
      inLanguage: locale,
      isPartOf: { '@id': websiteId },
      about: { '@id': organizationId },
    },
  ]
}
