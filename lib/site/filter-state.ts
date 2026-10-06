// 서버의 data-f-<key> 값은 |로 잇는다. FilterBar가 이 값과 data-search를 읽어 쿼리에 반영한다.

export type FacetOption = { value: string; label: string; count: number }

/** 여러 값을 고를 때 하나라도 맞으면(any) / 모두 맞아야(all) 통과. */
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

/** `data-f-*` 속성과 쿼리 문자열에서 여러 값을 잇는 구분자. */
export const VALUE_DELIMITER = '|'

export function normalizeSearchText(text: string): string {
  return text.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim()
}

/** 쿼리 문자열을 필터 상태로 읽는다. 알려진 분류 키만 받는다. */
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

/** 필터 상태를 쿼리 문자열로 쓴다(빈 값은 생략). */
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
  return createFilterMatcher(state, modes)(item)
}

/** 같은 조건으로 여러 행을 검사할 때 검색어와 선택 조건을 한 번만 준비한다. */
export function createFilterMatcher(
  state: FilterState,
  modes: Readonly<Record<string, FacetMode>> = {}
): (item: FilterableItem) => boolean {
  const terms = normalizeSearchText(state.q).split(' ').filter(Boolean)
  const selected = Object.entries(state.selected).filter(
    ([, values]) => values.length > 0
  )

  return (item) => {
    if (!terms.every((term) => item.search.includes(term))) return false
    return selected.every(([key, values]) => {
      const own = item.facets[key] ?? []
      return modes[key] === 'all'
        ? values.every((value) => own.includes(value))
        : values.some((value) => own.includes(value))
    })
  }
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

/** FilterBar가 쓰는 문구. 사전 전체를 클라이언트로 보내지 않도록 서버 페이지가 필요한 문구만 넘긴다. */
export type FilterBarCopy = {
  label: string
  search: string
  searchPlaceholder: string
  resultOne: string
  resultMany: string
  noResults: string
  reset: string
}
