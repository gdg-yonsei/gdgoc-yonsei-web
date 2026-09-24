import { describe, expect, it } from 'vitest'
import {
  adjacentSessions,
  groupSessionLog,
  relatedSessions,
  sessionFacets,
  sessionLocation,
  sessionSearchText,
  sessionTitle,
  type LogSession,
} from '@/lib/site/session-log'

function session(
  overrides: Partial<LogSession> & Pick<LogSession, 'id'>
): LogSession {
  return {
    name: `Session ${overrides.id}`,
    nameKo: `세션 ${overrides.id}`,
    category: 'tech_talk',
    type: 'General Session',
    mainImage: '/session-default.png',
    startAt: new Date('2025-11-04T19:00:00.000Z'),
    endAt: new Date('2025-11-04T21:00:00.000Z'),
    location: 'Engineering Hall',
    locationKo: '공학원',
    createdAt: new Date('2025-10-01T00:00:00.000Z'),
    updatedAt: new Date('2025-10-02T00:00:00.000Z'),
    partName: 'Cloud',
    generationName: '25-26',
    generationStartDate: '2025-03-01',
    ...overrides,
  }
}

const at = (iso: string) => new Date(iso)

describe('session titles and places', () => {
  it('falls back to English when Korean text is missing', () => {
    const englishOnly = session({ id: 'a', name: 'Sixth T19', nameKo: '' })
    expect(sessionTitle(englishOnly, 'ko')).toBe('Sixth T19')
    expect(sessionTitle(englishOnly, 'en')).toBe('Sixth T19')
    expect(
      sessionLocation({ location: 'Room 101', locationKo: null }, 'ko')
    ).toBe('Room 101')
    expect(
      sessionLocation({ location: null, locationKo: null }, 'en')
    ).toBeNull()
  })
})

describe('groupSessionLog', () => {
  it('groups by generation (newest first), then month, with undated sessions last', () => {
    const log = groupSessionLog([
      session({
        id: 'old',
        generationName: '24-25',
        generationStartDate: '2024-03-01',
        startAt: at('2024-09-10T19:00:00.000Z'),
      }),
      session({ id: 'oct', startAt: at('2025-10-07T19:00:00.000Z') }),
      session({ id: 'tba', startAt: null, endAt: null }),
      session({ id: 'nov-late', startAt: at('2025-11-25T19:00:00.000Z') }),
      session({ id: 'nov-early', startAt: at('2025-11-04T19:00:00.000Z') }),
    ])

    expect(
      log.map((generation) => [generation.name, generation.count])
    ).toEqual([
      ['25-26', 4],
      ['24-25', 1],
    ])
    expect(
      log[0]?.months.map((month) => [
        month.key,
        month.sessions.map((entry) => entry.id),
      ])
    ).toEqual([
      ['2025-11', ['nov-late', 'nov-early']],
      ['2025-10', ['oct']],
      ['tba', ['tba']],
    ])
  })
})

describe('sessionFacets', () => {
  it('counts categories in schema order, parts by size and generations newest first', () => {
    const facets = sessionFacets(
      [
        session({ id: '1', category: 'hackathon', partName: 'UI/UX' }),
        session({ id: '2', category: 'tech_talk', partName: 'Cloud' }),
        session({ id: '3', category: 'tech_talk', partName: 'Cloud' }),
        session({
          id: '4',
          category: 'tech_talk',
          partName: null,
          generationName: '24-25',
          generationStartDate: '2024-03-01',
        }),
      ],
      'en'
    )

    expect(facets.categories).toEqual([
      { value: 'tech_talk', label: 'Tech Talk', count: 3 },
      { value: 'hackathon', label: 'Hackathon', count: 1 },
    ])
    expect(facets.parts).toEqual([
      { value: 'Cloud', label: 'Cloud', count: 2 },
      { value: 'UI/UX', label: 'UI/UX', count: 1 },
    ])
    expect(facets.generations.map((option) => option.value)).toEqual([
      '25-26',
      '24-25',
    ])
  })
})

describe('sessionSearchText', () => {
  it('indexes both languages, the part, the place and the category names', () => {
    const text = sessionSearchText(
      session({ id: 'a', name: 'Sixth T19', nameKo: '여섯 번째 T19' })
    )
    expect(text).toContain('sixth t19')
    expect(text).toContain('여섯 번째 t19')
    expect(text).toContain('cloud')
    expect(text).toContain('공학원')
    expect(text).toContain('tech talk')
    expect(text).toContain('기술 세션')
  })
})

describe('session neighbours', () => {
  const archive = [
    session({ id: 'b', startAt: at('2025-11-04T19:00:00.000Z') }),
    session({
      id: 'a',
      generationName: '24-25',
      generationStartDate: '2024-03-01',
      startAt: at('2025-01-10T19:00:00.000Z'),
    }),
    session({ id: 'undated', startAt: null }),
    session({
      id: 'c',
      startAt: at('2025-11-11T19:00:00.000Z'),
      partName: 'UI/UX',
      category: 'hackathon',
    }),
  ]

  it('walks the whole archive chronologically', () => {
    expect(adjacentSessions(archive, 'b')).toEqual({
      previous: archive[1],
      next: archive[3],
    })
    expect(adjacentSessions(archive, 'undated')).toEqual({
      previous: null,
      next: null,
    })
  })

  it('prefers the same part in the same generation, then the category', () => {
    const current = session({
      id: 'x',
      startAt: at('2025-11-06T19:00:00.000Z'),
    })
    expect(
      relatedSessions([...archive, current], current).map((entry) => entry.id)
    ).toEqual(['b', 'undated', 'a'])
  })
})
