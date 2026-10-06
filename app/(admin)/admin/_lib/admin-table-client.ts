/** React Compiler가 컴포넌트 계산을 메모이즈하므로 `useMemo`를 따로 쓰지 않는다. */

/** 필터 선택값 "전체". 이 값이면 해당 필터를 적용하지 않는다. */
export const ALL_FILTER_VALUE = 'all'

export type AdminTableFilter<T> = {
  value: string
  predicate: (item: T, value: string) => boolean
}

export function getUniqueStringOptions<T>(
  items: readonly T[],
  getValue: (item: T) => string | null | undefined
): string[] {
  const options = new Set<string>()
  for (const item of items) {
    const value = getValue(item)
    if (value) options.add(value)
  }
  return [...options].sort()
}

/** 검색어를 소문자로 바꾸고 앞뒤 공백을 지운 뒤 `matchesSearch`에 넘긴다. */
export function filterAndSortItems<T>({
  items,
  searchQuery,
  filters = [],
  sortBy,
  matchesSearch,
  compareItems,
}: {
  items: readonly T[]
  searchQuery: string
  filters?: readonly AdminTableFilter<T>[]
  sortBy: string
  matchesSearch: (item: T, query: string) => boolean
  compareItems: (left: T, right: T, sortBy: string) => number
}): T[] {
  const query = searchQuery.toLowerCase().trim()
  const activeFilters = filters.filter(
    (filter) => filter.value !== ALL_FILTER_VALUE
  )

  return items
    .filter((item) => query === '' || matchesSearch(item, query))
    .filter((item) =>
      activeFilters.every((filter) => filter.predicate(item, filter.value))
    )
    .sort((left, right) => compareItems(left, right, sortBy))
}

export type GenerationGroup<T> = {
  generationId: number
  generationName: string
  items: T[]
}

/** 최신 기수(ID 내림차순)부터 묶고, 묶음 안은 입력 순서를 유지한다. 기수가 없으면 `Unknown`에 모인다. */
export function groupByGeneration<T>(
  items: readonly T[],
  getGeneration: (item: T) => {
    id: number | null | undefined
    name: string | null | undefined
  }
): GenerationGroup<T>[] {
  const groups = new Map<string, GenerationGroup<T>>()

  for (const item of items) {
    const generation = getGeneration(item)
    const key = String(generation.id ?? 'none')
    let group = groups.get(key)
    if (!group) {
      group = {
        generationId: generation.id ?? 0,
        generationName: generation.name ?? 'Unknown',
        items: [],
      }
      groups.set(key, group)
    }
    group.items.push(item)
  }

  return [...groups.values()].sort(
    (left, right) => right.generationId - left.generationId
  )
}

/** CSV 셀 값. `null`/`undefined`는 빈 칸이 된다. */
export type CsvCell = string | number | boolean | Date | null | undefined

function escapeCsvCell(value: CsvCell): string {
  const text = value == null ? '' : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

/** 엑셀이 한글을 읽도록 UTF-8 BOM을 붙이고, 파일 이름에는 오늘 날짜를 넣는다. */
export function downloadCsv({
  filenamePrefix,
  headers,
  rows,
}: {
  filenamePrefix: string
  headers: readonly CsvCell[]
  rows: readonly (readonly CsvCell[])[]
}) {
  const csvContent = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ].join('\n')

  const blob = new Blob([`\uFEFF${csvContent}`], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.csv`
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
