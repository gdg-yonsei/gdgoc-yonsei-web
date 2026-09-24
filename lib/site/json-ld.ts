import type { Locale } from '@/i18n-config'
import { toKstIso } from '@/lib/site/datetime'

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
