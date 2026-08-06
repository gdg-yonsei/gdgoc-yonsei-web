'use client'

import { useMemo, useState } from 'react'
import AdminDataTable, {
  type AdminColumn,
} from '@/app/components/admin/data-table'
import AdminEmptyState from '@/app/components/admin/empty-state'
import AdminTableToolbar from '@/app/(admin)/admin/_components/admin-table-toolbar'
import {
  downloadCsv,
  useFilteredSortedItems,
} from '@/app/(admin)/admin/_lib/admin-table-client'
import {
  formatAdminDate,
  localizeAdminHref,
  type AdminMessages,
} from '@/lib/admin-i18n'
import { Locale } from '@/i18n-config'

export type AdminGenerationListItem = {
  id: number
  name: string
  startDate: string
  endDate: string | null
}

function formatDate(value: string | null | undefined, locale: Locale) {
  if (!value) return null
  return formatAdminDate(value, locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/**
 * 기수 목록.
 *
 * 이 페이지에는 검색·정렬·CSV가 아예 없었습니다. 나머지 목록과 동일한 툴바를
 * 붙여 일관성을 맞춥니다.
 */
export default function GenerationsTableClient({
  generationsData,
  locale,
  t,
}: {
  generationsData: AdminGenerationListItem[]
  locale: Locale
  t: AdminMessages
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('id-desc')

  const filteredGenerations = useFilteredSortedItems({
    items: generationsData,
    searchQuery,
    sortBy,
    matchesSearch: (generation, query) =>
      generation.name.toLowerCase().includes(query),
    compareItems: (left, right, key) =>
      key === 'name' ? left.name.localeCompare(right.name) : right.id - left.id,
  })

  const columns = useMemo<AdminColumn<AdminGenerationListItem>[]>(
    () => [
      {
        key: 'name',
        header: t.columnName,
        width: 'minmax(0,2fr)',
        primary: true,
        render: (generation) => generation.name,
      },
      {
        key: 'period',
        header: t.columnPeriod,
        width: 'minmax(0,1.5fr)',
        render: (generation) => {
          const start = formatDate(generation.startDate, locale)
          const end = formatDate(generation.endDate, locale)
          return `${start ?? t.tbd} – ${end ?? t.tbd}`
        },
      },
    ],
    [t, locale]
  )

  const handleExportCsv = () => {
    downloadCsv({
      filenamePrefix: 'generations',
      headers: [t.name, t.startTime, t.endTime],
      rows: filteredGenerations.map((generation) => [
        generation.name,
        formatDate(generation.startDate, locale) ?? '',
        formatDate(generation.endDate, locale) ?? '',
      ]),
    })
  }

  return (
    <div className={'flex flex-col gap-4'}>
      <AdminTableToolbar
        searchValue={searchQuery}
        searchPlaceholder={t.searchPlaceholder}
        onSearchChange={setSearchQuery}
        exportLabel={t.exportCsv}
        onExportCsv={handleExportCsv}
        sortControl={{
          id: 'sort',
          label: t.sortBy,
          value: sortBy,
          onChange: setSortBy,
          options: [
            { value: 'id-desc', label: t.sortByCreated },
            { value: 'name', label: t.sortByName },
          ],
        }}
      />
      <AdminDataTable
        items={filteredGenerations}
        caption={t.generations}
        getKey={(generation) => String(generation.id)}
        getHref={(generation) =>
          localizeAdminHref(`/admin/generations/${generation.id}`, locale)
        }
        // e2e가 `getByRole('link', { name: /Generation: <name>/ })`로 행을 찾습니다.
        getAriaLabel={(generation) => `${t.generation}: ${generation.name}`}
        columns={columns}
        empty={
          <AdminEmptyState title={t.noResults} description={t.noResultsHint} />
        }
      />
    </div>
  )
}
