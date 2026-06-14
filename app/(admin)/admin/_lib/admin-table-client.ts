'use client'

import { useMemo } from 'react'

export const ALL_FILTER_VALUE = 'all'

export type AdminTableFilter<T> = {
  value: string
  predicate: (item: T, value: string) => boolean
}

export function getUniqueStringOptions<T>(
  items: readonly T[],
  getValue: (item: T) => string | null | undefined
) {
  return Array.from(
    items.reduce((options, item) => {
      const value = getValue(item)
      if (value) {
        options.add(value)
      }
      return options
    }, new Set<string>())
  ).sort()
}

export function useFilteredSortedItems<T>({
  items,
  searchQuery,
  filters,
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
}) {
  return useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    const activeFilters = (filters ?? []).filter(
      (filter) => filter.value !== ALL_FILTER_VALUE
    )

    return items
      .filter((item) => query === '' || matchesSearch(item, query))
      .filter((item) =>
        activeFilters.every((filter) => filter.predicate(item, filter.value))
      )
      .sort((left, right) => compareItems(left, right, sortBy))
  }, [items, searchQuery, filters, sortBy, matchesSearch, compareItems])
}

export function useGroupedItems<T, G>({
  items,
  getGroupKey,
  createGroup,
  addItem,
  compareGroups,
}: {
  items: readonly T[]
  getGroupKey: (item: T) => string
  createGroup: (item: T) => G
  addItem: (group: G, item: T) => void
  compareGroups: (left: G, right: G) => number
}) {
  return useMemo(() => {
    const groups = new Map<string, G>()

    for (const item of items) {
      const key = getGroupKey(item)
      const group = groups.get(key)

      if (group) {
        addItem(group, item)
        continue
      }

      const nextGroup = createGroup(item)
      addItem(nextGroup, item)
      groups.set(key, nextGroup)
    }

    return Array.from(groups.values()).sort(compareGroups)
  }, [items, getGroupKey, createGroup, addItem, compareGroups])
}

export type CsvCell = string | number | boolean | Date | null | undefined

function escapeCsvCell(value: CsvCell): string {
  const text = value == null ? '' : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

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
