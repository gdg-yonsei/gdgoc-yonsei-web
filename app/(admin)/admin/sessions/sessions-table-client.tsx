'use client'

/**
 * 세션 목록 표(클라이언트 컴포넌트). 검색·필터·정렬·CSV 내보내기는 브라우저에서 한다.
 */
import { useState } from 'react'
import Image from 'next/image'
import type { AdminColumn } from '@/app/components/admin/data-table'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import AdminTableToolbar from '@/app/(admin)/admin/_components/admin-table-toolbar'
import GenerationGroupedTables from '@/app/(admin)/admin/_components/generation-grouped-tables'
import {
  ALL_FILTER_VALUE,
  downloadCsv,
  filterAndSortItems,
  getUniqueStringOptions,
  groupByGeneration,
} from '@/app/(admin)/admin/_lib/admin-table-client'
import { formatAdminDate, localizeAdminHref } from '@/lib/admin-i18n'
import type { Locale } from '@/lib/i18n'
import type { AdminGenerationScope } from '@/lib/server/admin-generation-scope'
import type { AdminSessionListItem } from '@/lib/server/fetcher/admin/get-sessions'

/**
 * 세션 일시 표시. 세션 시간은 서울 벽시계 시각을 UTC 라벨로 저장하므로
 * (`lib/format/datetime.ts` 참고) UTC로 표시해야 입력한 시각 그대로 보인다.
 */
function formatSessionDateTime(
  value: Date | string | null,
  locale: Locale,
  fallback: string
) {
  return value
    ? formatAdminDate(value, locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
      })
    : fallback
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
  if (sortBy === 'name') return left.name.localeCompare(right.name)

  const leftTime = left.startAt ? new Date(left.startAt).getTime() : 0
  const rightTime = right.startAt ? new Date(right.startAt).getTime() : 0
  return sortBy === 'date-asc' ? leftTime - rightTime : rightTime - leftTime
}

/** 세션 목록 표(검색, 파트 필터, 일정·이름 정렬, CSV 내보내기, 기수별 묶음). */
export default function SessionsTableClient({
  sessionsData,
  scope,
}: {
  sessionsData: AdminSessionListItem[]
  scope: AdminGenerationScope | null
}) {
  const { locale, messages: t } = useAdminI18n()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPart, setSelectedPart] = useState(ALL_FILTER_VALUE)
  const [sortBy, setSortBy] = useState('date-desc')

  const uniqueParts = getUniqueStringOptions(
    sessionsData,
    (session) => session.partName
  )
  const filteredSessions = filterAndSortItems({
    items: sessionsData,
    searchQuery,
    filters: [
      {
        value: selectedPart,
        predicate: (session, value) => session.partName === value,
      },
    ],
    sortBy,
    matchesSearch: sessionMatchesSearch,
    compareItems: compareSessions,
  })
  const groups = groupByGeneration(filteredSessions, (session) => ({
    id: session.generationId,
    name: session.generationName,
  }))

  const columns: AdminColumn<AdminSessionListItem>[] = [
    {
      key: 'name',
      header: t.columnName,
      width: 'minmax(0,2.5fr)',
      primary: true,
      render: (session) => (
        <span className={'flex min-w-0 items-center gap-3'}>
          <Image
            src={session.mainImage}
            alt={''}
            width={160}
            height={107}
            className={
              'border-hairline aspect-3/2 w-14 shrink-0 rounded-sm border object-cover'
            }
            placeholder={'blur'}
            blurDataURL={'/default-image.png'}
          />
          <span className={'flex min-w-0 flex-col'}>
            <span className={'truncate'}>{session.name}</span>
            {session.nameKo && (
              <span className={'type-eyebrow text-ink-muted truncate'}>
                {session.nameKo}
              </span>
            )}
          </span>
        </span>
      ),
    },
    {
      key: 'schedule',
      header: t.columnSchedule,
      width: '11rem',
      render: (session) =>
        formatSessionDateTime(session.startAt, locale, t.tbd),
    },
    {
      key: 'part',
      header: t.columnPart,
      width: 'minmax(0,1fr)',
      render: (session) =>
        session.partName ? (
          <span className={'admin-badge-primary'}>{session.partName}</span>
        ) : (
          <span className={'admin-badge-neutral'}>{t.generalSession}</span>
        ),
    },
    {
      key: 'generation',
      header: t.columnGeneration,
      width: '8rem',
      hideOnMobile: scope?.kind !== 'all',
      render: (session) => session.generationName ?? '—',
    },
  ]

  const handleExportCsv = () => {
    downloadCsv({
      filenamePrefix: 'sessions',
      headers: [t.name, t.nameKo, t.part, t.start, t.end, t.generation],
      rows: filteredSessions.map((session) => [
        session.name,
        session.nameKo,
        session.partName,
        formatSessionDateTime(session.startAt, locale, t.tbd),
        formatSessionDateTime(session.endAt, locale, t.tbd),
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
      <GenerationGroupedTables
        groups={groups}
        showGenerationHeadings={scope?.kind === 'all'}
        captionLabel={t.sessions}
        columns={columns}
        getKey={(session) => session.id}
        getHref={(session) =>
          localizeAdminHref(`/admin/sessions/${session.id}`, locale)
        }
      />
    </div>
  )
}
