import { describe, expect, it } from 'vitest'
import {
  EMPTY_FILTER,
  facetAttribute,
  isFilterActive,
  joinFacetValues,
  matchesFilter,
  normalizeSearchText,
  parseFilterState,
  readFilterableItem,
  serializeFilterState,
  toggleFacetValue,
} from '@/lib/site/filter-state'

const KEYS = ['category', 'part'] as const

describe('parseFilterState', () => {
  it('reads known facets and the search query', () => {
    expect(
      parseFilterState('?q=cloud&category=tech_talk,hackathon&part=Cloud', KEYS)
    ).toEqual({
      q: 'cloud',
      selected: { category: ['tech_talk', 'hackathon'], part: ['Cloud'] },
    })
  })

  it('ignores unknown keys, empty values and duplicates', () => {
    expect(
      parseFilterState('?foo=1&category=,tech_talk,tech_talk&part=', KEYS)
    ).toEqual({ q: '', selected: { category: ['tech_talk'] } })
  })

  it('keeps the raw query so typing a trailing space is not swallowed', () => {
    expect(parseFilterState('?q=next+', KEYS).q).toBe('next ')
  })
})

describe('serializeFilterState', () => {
  it('round-trips and drops empty facets', () => {
    const query = serializeFilterState(
      { q: 'ui', selected: { category: ['hackathon'], part: [] } },
      KEYS
    )
    expect(query).toBe('?q=ui&category=hackathon')
    expect(parseFilterState(query, KEYS)).toEqual({
      q: 'ui',
      selected: { category: ['hackathon'] },
    })
  })

  it('returns an empty string for the empty state', () => {
    expect(serializeFilterState(EMPTY_FILTER, KEYS)).toBe('')
    expect(isFilterActive(EMPTY_FILTER)).toBe(false)
    expect(isFilterActive({ q: '   ', selected: { part: [] } })).toBe(false)
  })
})

describe('matchesFilter', () => {
  const item = {
    search: normalizeSearchText('Sixth T19 여섯 번째 T19 Cloud Tech Talk'),
    facets: {
      category: ['tech_talk'],
      part: ['Cloud'],
      links: ['demo', 'source'],
    },
  }

  it('ORs values inside a facet and ANDs facets', () => {
    expect(
      matchesFilter(item, {
        q: '',
        selected: { category: ['hackathon', 'tech_talk'], part: ['Cloud'] },
      })
    ).toBe(true)
    expect(
      matchesFilter(item, {
        q: '',
        selected: { category: ['tech_talk'], part: ['UI/UX'] },
      })
    ).toBe(false)
  })

  it('supports all-of facets', () => {
    const both = { q: '', selected: { links: ['demo', 'source'] } }
    expect(matchesFilter(item, both, { links: 'all' })).toBe(true)
    expect(
      matchesFilter(
        { ...item, facets: { ...item.facets, links: ['demo'] } },
        both,
        { links: 'all' }
      )
    ).toBe(false)
  })

  it('needs every search term, in any order, Korean and full-width included', () => {
    expect(matchesFilter(item, { q: 'cloud  ＴＡＬＫ', selected: {} })).toBe(
      true
    )
    expect(matchesFilter(item, { q: '여섯', selected: {} })).toBe(true)
    expect(matchesFilter(item, { q: 'cloud hackathon', selected: {} })).toBe(
      false
    )
  })
})

describe('state updates and DOM items', () => {
  it('toggles a value on and off', () => {
    const on = toggleFacetValue(EMPTY_FILTER, 'part', 'Cloud')
    expect(on.selected.part).toEqual(['Cloud'])
    expect(toggleFacetValue(on, 'part', 'Cloud').selected.part).toEqual([])
  })

  it('reads data attributes written by the server', () => {
    const element = document.createElement('li')
    element.setAttribute('data-search', 'campus compass')
    element.setAttribute(
      facetAttribute('tag'),
      joinFacetValues(['Next.js', null, 'Firebase'])
    )
    expect(readFilterableItem(element, ['tag', 'generation'])).toEqual({
      search: 'campus compass',
      facets: { tag: ['Next.js', 'Firebase'], generation: [] },
    })
  })
})
