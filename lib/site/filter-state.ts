/*
 * Filter state for the Session Log and project hubs. The server writes each
 * row's facets into `data-f-<key>` attributes (values joined by `|`) and a
 * normalized `data-search` string; the FilterBar island reads them back and
 * mirrors its state in the query string.
 */

export type FacetOption = { value: string; label: string; count: number }

export type FacetMode = 'any' | 'all'

export type FilterState = {
  q: string
  selected: Readonly<Record<string, readonly string[]>>
}

export type FilterableItem = {
  search: string
  facets: Readonly<Record<string, readonly string[]>>
}

export const EMPTY_FILTER: FilterState = { q: '', selected: {} }

export const VALUE_DELIMITER = '|'

export function normalizeSearchText(text: string): string {
  return text.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim()
}

export function parseFilterState(
  search: string,
  keys: readonly string[]
): FilterState {
  const params = new URLSearchParams(search)
  const selected: Record<string, string[]> = {}
  for (const key of keys) {
    const values = (params.get(key) ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
    if (values.length > 0) selected[key] = [...new Set(values)]
  }
  return { q: params.get('q') ?? '', selected }
}

export function serializeFilterState(
  state: FilterState,
  keys: readonly string[]
): string {
  const params = new URLSearchParams()
  if (state.q.trim()) params.set('q', state.q)
  for (const key of keys) {
    const values = state.selected[key]
    if (values && values.length > 0) params.set(key, values.join(','))
  }
  const query = params.toString()
  return query ? `?${query}` : ''
}

export function isFilterActive(state: FilterState): boolean {
  return (
    normalizeSearchText(state.q) !== '' ||
    Object.values(state.selected).some((values) => values.length > 0)
  )
}

export function toggleFacetValue(
  state: FilterState,
  key: string,
  value: string
): FilterState {
  const current = state.selected[key] ?? []
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value]
  return { ...state, selected: { ...state.selected, [key]: next } }
}

export function matchesFilter(
  item: FilterableItem,
  state: FilterState,
  modes: Readonly<Record<string, FacetMode>> = {}
): boolean {
  const terms = normalizeSearchText(state.q).split(' ').filter(Boolean)
  if (!terms.every((term) => item.search.includes(term))) return false

  return Object.entries(state.selected).every(([key, values]) => {
    if (values.length === 0) return true
    const own = item.facets[key] ?? []
    return modes[key] === 'all'
      ? values.every((value) => own.includes(value))
      : values.some((value) => own.includes(value))
  })
}

export function facetAttribute(key: string): string {
  return `data-f-${key}`
}

export function joinFacetValues(
  values: readonly (string | null | undefined)[]
): string {
  return values.filter(Boolean).join(VALUE_DELIMITER)
}

export function readFilterableItem(
  element: Element,
  keys: readonly string[]
): FilterableItem {
  const facets: Record<string, string[]> = {}
  for (const key of keys) {
    const raw = element.getAttribute(facetAttribute(key)) ?? ''
    facets[key] = raw ? raw.split(VALUE_DELIMITER) : []
  }
  return { search: element.getAttribute('data-search') ?? '', facets }
}
