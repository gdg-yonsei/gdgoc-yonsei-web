import type { Locale } from '@/lib/i18n'
import { toKstIso } from '@/lib/format/datetime'
import { CHANNELS } from '@/lib/site/channels'

/* Pure builders: callers pass absolute URLs (see lib/seo/metadata.ts). */

const CONTEXT = 'https://schema.org'

export type JsonLdCrumb = { name: string; url: string }

export type JsonLdOrganization = { id: string; name: string; url: string }

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

/** Sessions meet on Yonsei University's Sinchon campus. */
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
    // Google reads EventScheduled as "happened as planned"; EventCompleted is
    // not a valid EventStatusType.
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
