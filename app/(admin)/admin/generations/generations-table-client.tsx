'use client'

import { useState } from 'react'
import AdminDataTable, {
  type AdminColumn,
} from '@/app/components/admin/data-table'
import AdminEmptyState from '@/app/components/admin/empty-state'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import AdminTableToolbar from '@/app/(admin)/admin/_components/admin-table-toolbar'
import {
  downloadCsv,
  filterAndSortItems,
} from '@/app/(admin)/admin/_lib/admin-table-client'
import { formatAdminDate, localizeAdminHref } from '@/lib/admin-i18n'
import type { Locale } from '@/lib/i18n'
import type { AdminGenerationListItem } from '@/lib/server/fetcher/admin/get-generations'

/** `YYYY-MM-DD`는 UTC 자정으로 파싱되므로, 로컬 날짜가 하루 밀리지 않게 UTC로 표시한다. */
function formatGenerationDate(value: string | null, locale: Locale) {
  if (!value) return null
  return formatAdminDate(value, locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'UTC',
  })
}

/** 기수 자체가 그룹 기준이라 다른 목록과 달리 기수별로 다시 묶지 않는다. */
export default function GenerationsTableClient({
  generationsData,
}: {
  generationsData: AdminGenerationListItem[]
}) {
  const { locale, messages: t } = useAdminI18n()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('id-desc')

  const filteredGenerations = filterAndSortItems({
    items: generationsData,
    searchQuery,
    sortBy,
    matchesSearch: (generation, query) =>
      generation.name.toLowerCase().includes(query),
    compareItems: (left, right, key) =>
      key === 'name' ? left.name.localeCompare(right.name) : right.id - left.id,
  })

  const columns: AdminColumn<AdminGenerationListItem>[] = [
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
        const start = formatGenerationDate(generation.startDate, locale)
        const end = formatGenerationDate(generation.endDate, locale)
        return `${start ?? t.tbd} – ${end ?? t.tbd}`
      },
    },
  ]

  const handleExportCsv = () => {
    downloadCsv({
      filenamePrefix: 'generations',
      headers: [t.name, t.startTime, t.endTime],
      rows: filteredGenerations.map((generation) => [
        generation.name,
        formatGenerationDate(generation.startDate, locale) ?? '',
        formatGenerationDate(generation.endDate, locale) ?? '',
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
        // e2e가 `getByRole('link', { name: /Generation: <name>/ })`로 행을 찾는다.
        getAriaLabel={(generation) => `${t.generation}: ${generation.name}`}
        columns={columns}
        empty={
          <AdminEmptyState title={t.noResults} description={t.noResultsHint} />
        }
      />
    </div>
  )
}
