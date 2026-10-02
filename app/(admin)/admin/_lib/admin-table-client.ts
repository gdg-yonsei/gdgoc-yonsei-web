/**
 * 관리자 목록 화면(기수·파트·멤버·세션·프로젝트) 공용 클라이언트 헬퍼.
 *
 * 검색·필터·정렬, 기수별 그룹, CSV 내보내기를 순수 함수로 제공한다.
 * React Compiler가 컴포넌트 안의 계산을 자동으로 메모이즈하므로 `useMemo`를 따로
 * 쓰지 않는다.
 */

/** 필터 선택값 "전체". 이 값이면 해당 필터를 적용하지 않는다. */
export const ALL_FILTER_VALUE = 'all'

/** 툴바 드롭다운 하나에 대응하는 필터. */
export type AdminTableFilter<T> = {
  value: string
  predicate: (item: T, value: string) => boolean
}

/** 목록에서 필터 드롭다운에 쓸 고유 값들을 모아 정렬한다(빈 값 제외). */
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

/**
 * 검색어·필터로 거르고 선택한 기준으로 정렬한 새 배열을 만든다.
 * 검색어는 소문자로 바꾸고 앞뒤 공백을 지운 뒤 `matchesSearch`에 넘긴다.
 */
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

/** 한 기수에 속한 행 묶음. */
export type GenerationGroup<T> = {
  generationId: number
  generationName: string
  items: T[]
}

/**
 * 행을 기수별로 묶는다. 묶음은 최신 기수(ID가 큰 순)부터, 묶음 안의 행은 입력
 * 순서(이미 정렬된 순서)를 유지한다. 기수 정보가 없는 행은 `Unknown` 묶음에 모인다.
 */
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

/**
 * 표 데이터를 CSV 파일로 내려받는다.
 * 엑셀이 한글을 깨뜨리지 않도록 UTF-8 BOM을 붙이고, 파일 이름에 오늘 날짜를 넣는다.
 */
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
