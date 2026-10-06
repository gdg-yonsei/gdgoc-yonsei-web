'use client'

import { useState } from 'react'
import type { AdminColumn } from '@/app/components/admin/data-table'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import AdminTableToolbar from '@/app/(admin)/admin/_components/admin-table-toolbar'
import GenerationGroupedTables from '@/app/(admin)/admin/_components/generation-grouped-tables'
import {
  downloadCsv,
  filterAndSortItems,
  groupByGeneration,
} from '@/app/(admin)/admin/_lib/admin-table-client'
import { localizeAdminHref } from '@/lib/admin-i18n'
import type { AdminGenerationScope } from '@/lib/server/admin-generation-scope'
import type { AdminPartListItem } from '@/lib/server/fetcher/admin/get-parts'

function partMatchesSearch(part: AdminPartListItem, query: string) {
  return (
    part.name.toLowerCase().includes(query) ||
    (part.description ?? '').toLowerCase().includes(query)
  )
}

function compareParts(
  left: AdminPartListItem,
  right: AdminPartListItem,
  sortBy: string
) {
  if (sortBy === 'name') return left.name.localeCompare(right.name)
  if (sortBy === 'members') return right.memberCount - left.memberCount
  return left.displayOrder - right.displayOrder || left.id - right.id
}

/** 기본 정렬은 공개 사이트 노출 순서 displayOrder다. */
export default function PartsTableClient({
  partsData,
  scope,
}: {
  partsData: AdminPartListItem[]
  scope: AdminGenerationScope | null
}) {
  const { locale, messages: t } = useAdminI18n()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('order')

  const filteredParts = filterAndSortItems({
    items: partsData,
    searchQuery,
    sortBy,
    matchesSearch: partMatchesSearch,
    compareItems: compareParts,
  })
  const groups = groupByGeneration(filteredParts, (part) => ({
    id: part.generationId,
    name: part.generationName,
  }))

  const columns: AdminColumn<AdminPartListItem>[] = [
    {
      key: 'displayOrder',
      header: t.displayOrder,
      width: '7rem',
      render: (part) => part.displayOrder,
    },
    {
      key: 'name',
      header: t.columnName,
      width: 'minmax(0,1.5fr)',
      primary: true,
      render: (part) => part.name,
    },
    {
      key: 'description',
      header: t.description,
      width: 'minmax(0,2.5fr)',
      render: (part) => part.description ?? t.notProvided,
    },
    {
      key: 'members',
      header: t.columnMembers,
      width: '7rem',
      render: (part) => (
        <span className={'admin-badge-neutral'}>{part.memberCount}</span>
      ),
    },
  ]

  const handleExportCsv = () => {
    downloadCsv({
      filenamePrefix: 'parts',
      headers: [t.name, t.description, t.member, t.generation],
      rows: filteredParts.map((part) => [
        part.name,
        part.description,
        part.memberCount,
        part.generationName,
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
            { value: 'order', label: t.displayOrder },
            { value: 'name', label: t.sortByName },
            { value: 'members', label: t.columnMembers },
          ],
        }}
      />
      <GenerationGroupedTables
        groups={groups}
        showGenerationHeadings={scope?.kind === 'all'}
        captionLabel={t.parts}
        columns={columns}
        getKey={(part) => String(part.id)}
        getHref={(part) => localizeAdminHref(`/admin/parts/${part.id}`, locale)}
      />
    </div>
  )
}
