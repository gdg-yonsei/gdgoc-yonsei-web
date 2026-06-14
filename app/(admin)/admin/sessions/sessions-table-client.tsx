'use client'

import { useState, useMemo } from 'react'
import SessionCard from '@/app/(admin)/admin/sessions/sessionCard'
import { type AdminSessionListItem } from '@/lib/server/fetcher/admin/get-sessions'
import { type AdminGenerationScope } from '@/lib/server/admin-generation-scope'
import { formatAdminDate, type AdminMessages } from '@/lib/admin-i18n'
import { Locale } from '@/i18n-config'
import AdminTableToolbar from '@/app/(admin)/admin/_components/admin-table-toolbar'
import {
  ALL_FILTER_VALUE,
  downloadCsv,
  getUniqueStringOptions,
  useFilteredSortedItems,
  useGroupedItems,
} from '@/app/(admin)/admin/_lib/admin-table-client'

interface SessionsTableClientProps {
  sessionsData: AdminSessionListItem[]
  scope: AdminGenerationScope | null
  locale: Locale
  t: AdminMessages
}

type SessionGroup = {
  generationName: string
  generationId: number
  sessions: AdminSessionListItem[]
}

function sessionMatchesSearch(session: AdminSessionListItem, query: string) {
  return (
    session.name.toLowerCase().includes(query) ||
    (session.nameKo?.toLowerCase().includes(query) ?? false)
  )
}

function compareSessions(
  left: AdminSessionListItem,
  right: AdminSessionListItem,
  sortBy: string
) {
  if (sortBy === 'name') {
    return left.name.localeCompare(right.name)
  }

  const leftTime = left.startAt ? new Date(left.startAt).getTime() : 0
  const rightTime = right.startAt ? new Date(right.startAt).getTime() : 0

  return sortBy === 'date-asc' ? leftTime - rightTime : rightTime - leftTime
}

function getSessionGroupKey(session: AdminSessionListItem) {
  return String(session.generationId ?? 'none')
}

function createSessionGroup(session: AdminSessionListItem): SessionGroup {
  return {
    generationName: session.generationName ?? 'Unknown',
    generationId: session.generationId ?? 0,
    sessions: [],
  }
}

function addSessionToGroup(group: SessionGroup, session: AdminSessionListItem) {
  group.sessions.push(session)
}

function compareSessionGroups(left: SessionGroup, right: SessionGroup) {
  return right.generationId - left.generationId
}

export default function SessionsTableClient({
  sessionsData,
  scope,
  locale,
  t,
}: SessionsTableClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPart, setSelectedPart] = useState(ALL_FILTER_VALUE)
  const [sortBy, setSortBy] = useState('date-desc')

  const uniqueParts = useMemo(
    () => getUniqueStringOptions(sessionsData, (session) => session.partName),
    [sessionsData]
  )
  const filters = useMemo(
    () => [
      {
        value: selectedPart,
        predicate: (session: AdminSessionListItem, value: string) =>
          session.partName === value,
      },
    ],
    [selectedPart]
  )
  const filteredAndSortedSessions = useFilteredSortedItems({
    items: sessionsData,
    searchQuery,
    filters,
    sortBy,
    matchesSearch: sessionMatchesSearch,
    compareItems: compareSessions,
  })
  const groupedSessions = useGroupedItems({
    items: filteredAndSortedSessions,
    getGroupKey: getSessionGroupKey,
    createGroup: createSessionGroup,
    addItem: addSessionToGroup,
    compareGroups: compareSessionGroups,
  })

  const handleExportCsv = () => {
    downloadCsv({
      filenamePrefix: 'sessions',
      headers: [
        t.name,
        t.nameKo || '한글 이름',
        t.part,
        t.start,
        t.end,
        t.generation,
      ],
      rows: filteredAndSortedSessions.map((session) => [
        session.name,
        session.nameKo,
        session.partName,
        session.startAt
          ? formatAdminDate(session.startAt, locale, {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })
          : t.tbd,
        session.endAt
          ? formatAdminDate(session.endAt, locale, {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })
          : t.tbd,
        session.generationName,
      ]),
    })
  }

  return (
    <div className={'flex flex-col gap-4'}>
      <AdminTableToolbar
        searchValue={searchQuery}
        searchPlaceholder={t.searchSessionPlaceholder}
        onSearchChange={setSearchQuery}
        exportLabel={t.exportCsv}
        onExportCsv={handleExportCsv}
        filterControls={[
          {
            id: 'part',
            value: selectedPart,
            onChange: setSelectedPart,
            options: [
              { value: ALL_FILTER_VALUE, label: t.allParts },
              ...uniqueParts.map((part) => ({ value: part, label: part })),
            ],
          },
        ]}
        sortControl={{
          id: 'sort',
          label: t.sortBy,
          value: sortBy,
          onChange: setSortBy,
          options: [
            { value: 'date-desc', label: `${t.sortByDate} (${t.updatedAt})` },
            { value: 'date-asc', label: `${t.sortByDate} (▲)` },
            { value: 'name', label: t.sortByName },
          ],
        }}
      />

      {filteredAndSortedSessions.length === 0 ? (
        <div className={'rounded-2xl bg-white p-6 text-neutral-700 shadow-sm'}>
          <div className={'font-semibold'}>{t.noScopedResults}</div>
          <div className={'pt-1 text-sm text-neutral-500'}>
            {t.noScopedResultsHint}
          </div>
        </div>
      ) : (
        <div className={'flex w-full flex-col gap-6'}>
          {groupedSessions.map((group) => (
            <div key={group.generationName} className={'flex flex-col gap-2'}>
              {scope?.kind === 'all' && (
                <div
                  className={
                    'border-b border-neutral-200 pb-1 text-sm font-semibold text-neutral-600'
                  }
                >
                  {t.generation}: {group.generationName}
                </div>
              )}
              <div className={'member-data-grid w-full gap-4 pt-2'}>
                {group.sessions.map((session) => (
                  <SessionCard
                    session={session}
                    key={session.id}
                    locale={locale}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
