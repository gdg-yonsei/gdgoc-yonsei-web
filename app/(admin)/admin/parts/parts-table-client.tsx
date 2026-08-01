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
  useGroupedItems,
} from '@/app/(admin)/admin/_lib/admin-table-client'
import { type AdminPartListItem } from '@/lib/server/fetcher/admin/get-parts'
import { type AdminGenerationScope } from '@/lib/server/admin-generation-scope'
import { localizeAdminHref, type AdminMessages } from '@/lib/admin-i18n'
import { Locale } from '@/i18n-config'

type PartGroup = {
  generationName: string
  generationId: number
  items: AdminPartListItem[]
}

/**
 * 파트 목록.
 *
 * 기수 목록과 마찬가지로 툴바가 전혀 없던 페이지입니다.
 */
export default function PartsTableClient({
  partsData,
  scope,
  locale,
  t,
}: {
  partsData: AdminPartListItem[]
  scope: AdminGenerationScope | null
  locale: Locale
  t: AdminMessages
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('order')

  const filteredParts = useFilteredSortedItems({
    items: partsData,
    searchQuery,
    sortBy,
    matchesSearch: (part, query) =>
      part.name.toLowerCase().includes(query) ||
      (part.description ?? '').toLowerCase().includes(query),
    compareItems: (left, right, key) => {
      if (key === 'name') return left.name.localeCompare(right.name)
      if (key === 'members') return right.memberCount - left.memberCount
      return left.displayOrder - right.displayOrder
    },
  })

  const groupedParts = useGroupedItems<AdminPartListItem, PartGroup>({
    items: filteredParts,
    getGroupKey: (part) => String(part.generationId ?? 'none'),
    createGroup: (part) => ({
      generationName: part.generationName ?? 'Unknown',
      generationId: part.generationId ?? 0,
      items: [],
    }),
    addItem: (group, part) => group.items.push(part),
    compareGroups: (left, right) => right.generationId - left.generationId,
  })

  const columns = useMemo<AdminColumn<AdminPartListItem>[]>(
    () => [
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
        render: (part) => part.description ?? '—',
      },
      {
        key: 'members',
        header: t.columnMembers,
        width: '7rem',
        render: (part) => (
          <span className={'admin-badge-neutral'}>{part.memberCount}</span>
        ),
      },
    ],
    [t]
  )

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

      {filteredParts.length === 0 ? (
        <AdminEmptyState
          title={t.noScopedResults}
          description={t.noScopedResultsHint}
        />
      ) : (
        <div className={'flex w-full flex-col gap-6'}>
          {groupedParts.map((group) => (
            <div key={group.generationName} className={'flex flex-col gap-2'}>
              {scope?.kind === 'all' && (
                <h2 className={'admin-field-label'}>
                  {t.generation}: {group.generationName}
                </h2>
              )}
              <AdminDataTable
                items={group.items}
                caption={`${t.parts} — ${group.generationName}`}
                getKey={(part) => String(part.id)}
                getHref={(part) =>
                  localizeAdminHref(`/admin/parts/${part.id}`, locale)
                }
                columns={columns}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
