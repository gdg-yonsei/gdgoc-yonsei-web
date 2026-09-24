import { describe, expect, it } from 'vitest'
import {
  breadcrumbList,
  collectionPage,
  projectWork,
  sessionEvent,
  sessionLearningResource,
} from '@/lib/site/json-ld'

const organizer = {
  id: 'https://gdgoc.yonsei.ac.kr/#organization',
  name: 'GDGoC Yonsei',
  url: 'https://gdgoc.yonsei.ac.kr/en',
}

describe('JSON-LD builders', () => {
  it('numbers breadcrumb items from 1', () => {
    expect(
      breadcrumbList([
        { name: 'Home', url: 'https://x.dev/en' },
        { name: 'Sessions', url: 'https://x.dev/en/session' },
      ])
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://x.dev/en',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Sessions',
          item: 'https://x.dev/en/session',
        },
      ],
    })
  })

  it('describes a hub as a collection page with an item list', () => {
    const [page, list] = collectionPage({
      url: 'https://x.dev/en/session',
      name: 'Session Log',
      description: 'All sessions',
      locale: 'en',
      websiteId: 'https://x.dev/#website',
      items: [{ name: 'Sixth T19', url: 'https://x.dev/en/session/25-26/a' }],
    })
    expect(page).toMatchObject({
      '@type': 'CollectionPage',
      isPartOf: { '@id': 'https://x.dev/#website' },
    })
    expect(list).toMatchObject({
      '@type': 'ItemList',
      numberOfItems: 1,
      itemListElement: [{ position: 1, name: 'Sixth T19' }],
    })
  })

  it('marks sessions as scheduled offline events at Yonsei with KST times', () => {
    const event = sessionEvent({
      url: 'https://x.dev/en/session/25-26/a',
      name: 'Sixth T19',
      description: 'Talk',
      images: ['https://x.dev/session-default.png'],
      locale: 'en',
      startAt: new Date('2025-11-04T19:00:00.000Z'),
      endAt: new Date('2025-11-04T21:00:00.000Z'),
      location: null,
      organizer,
    })
    expect(event).toMatchObject({
      '@type': 'Event',
      startDate: '2025-11-04T19:00:00+09:00',
      endDate: '2025-11-04T21:00:00+09:00',
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      isAccessibleForFree: true,
      location: {
        '@type': 'Place',
        name: 'Yonsei University',
        address: { streetAddress: '50 Yonsei-ro', addressCountry: 'KR' },
      },
      organizer: { '@type': 'Organization', name: 'GDGoC Yonsei' },
    })
    expect(JSON.stringify(event)).not.toContain('EventCompleted')
  })

  it('falls back to a learning resource when a session has no date', () => {
    expect(
      sessionLearningResource({
        url: 'https://x.dev/en/session/25-26/a',
        name: 'Recording',
        description: 'Talk',
        images: [],
        locale: 'ko',
        providerId: organizer.id,
      })
    ).toMatchObject({
      '@type': 'LearningResource',
      provider: { '@id': organizer.id },
    })
  })

  it('adds SoftwareSourceCode only when a repository exists', () => {
    const base = {
      url: 'https://x.dev/en/project/25-26/p',
      name: 'Campus Compass',
      description: 'Indoor navigation',
      images: [],
      locale: 'en' as const,
      dateCreated: new Date('2025-03-01T00:00:00.000Z'),
      dateModified: new Date('2025-04-01T00:00:00.000Z'),
      creators: ['Kim Minji'],
      publisherId: organizer.id,
    }
    expect(
      projectWork({
        ...base,
        keywords: ['Flutter', 'Firebase'],
        repoUrl: 'https://github.com/gdg-yonsei/campus-compass',
      })
    ).toMatchObject({
      '@type': ['CreativeWork', 'SoftwareSourceCode'],
      codeRepository: 'https://github.com/gdg-yonsei/campus-compass',
      keywords: 'Flutter, Firebase',
      creator: [{ '@type': 'Person', name: 'Kim Minji' }],
    })
    const plain = projectWork({ ...base, keywords: [], repoUrl: null })
    expect(plain['@type']).toBe('CreativeWork')
    expect(plain).not.toHaveProperty('codeRepository')
    expect(plain).not.toHaveProperty('keywords')
  })
})
