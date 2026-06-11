'use client'

import { useState, useMemo } from 'react'
import { MagnifyingGlassIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import SessionCard from '@/app/(admin)/admin/sessions/sessionCard'
import { type AdminSessionListItem } from '@/lib/server/fetcher/admin/get-sessions'
import { type AdminGenerationScope } from '@/lib/server/admin-generation-scope'
import { formatAdminDate, type AdminMessages } from '@/lib/admin-i18n'
import { Locale } from '@/i18n-config'

interface SessionsTableClientProps {
  sessionsData: AdminSessionListItem[]
  scope: AdminGenerationScope | null
  locale: Locale
  t: AdminMessages
}

export default function SessionsTableClient({
  sessionsData,
  scope,
  locale,
  t,
}: SessionsTableClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPart, setSelectedPart] = useState('all')
  const [sortBy, setSortBy] = useState('date-desc') // date-desc | date-asc | name

  // Extract unique parts from sessions
  const uniqueParts = useMemo(() => {
    const partsSet = new Set<string>()
    sessionsData.forEach((session) => {
      if (session.partName) partsSet.add(session.partName)
    })
    return Array.from(partsSet).sort()
  }, [sessionsData])

  // Filter and sort sessions
  const filteredAndSortedSessions = useMemo(() => {
    let result = [...sessionsData]

    // 1. Search Query filter (Ko, En names)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (session) =>
          session.name.toLowerCase().includes(q) ||
          (session.nameKo && session.nameKo.toLowerCase().includes(q))
      )
    }

    // 2. Part filter
    if (selectedPart !== 'all') {
      result = result.filter((session) => session.partName === selectedPart)
    }

    // 3. Sort
    result.sort((left, right) => {
      if (sortBy === 'name') {
        return left.name.localeCompare(right.name)
      }

      const leftTime = left.startAt ? new Date(left.startAt).getTime() : 0
      const rightTime = right.startAt ? new Date(right.startAt).getTime() : 0

      if (sortBy === 'date-asc') {
        return leftTime - rightTime
      } else {
        // date-desc (default)
        return rightTime - leftTime
      }
    })

    return result
  }, [sessionsData, searchQuery, selectedPart, sortBy])

  // Group filtered results by generation
  const groupedSessions = useMemo(() => {
    return Object.values(
      filteredAndSortedSessions.reduce<
        Record<
          string,
          { generationName: string; sessions: AdminSessionListItem[] }
        >
      >((groups, session) => {
        const key = String(session.generationId ?? 'none')
        if (!groups[key]) {
          groups[key] = {
            generationName: session.generationName ?? 'Unknown',
            sessions: [],
          }
        }
        groups[key].sessions.push(session)
        return groups
      }, {})
    ).sort((left, right) => {
      const leftId = left.sessions[0]?.generationId ?? 0
      const rightId = right.sessions[0]?.generationId ?? 0
      return rightId - leftId
    })
  }, [filteredAndSortedSessions])

  // CSV Export function
  const handleExportCsv = () => {
    const headers = [
      t.name,
      t.nameKo || '한글 이름',
      t.part,
      t.start,
      t.end,
      t.generation,
    ]

    const csvRows = [headers.join(',')]

    filteredAndSortedSessions.forEach((session) => {
      const startText = session.startAt
        ? formatAdminDate(session.startAt, locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })
        : t.tbd

      const endText = session.endAt
        ? formatAdminDate(session.endAt, locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })
        : t.tbd

      const row = [
        `"${session.name.replace(/"/g, '""')}"`,
        `"${(session.nameKo || '').replace(/"/g, '""')}"`,
        `"${(session.partName || '').replace(/"/g, '""')}"`,
        `"${startText.replace(/"/g, '""')}"`,
        `"${endText.replace(/"/g, '""')}"`,
        `"${(session.generationName || '').replace(/"/g, '""')}"`,
      ]
      csvRows.push(row.join(','))
    })

    const csvContent = csvRows.join('\n')
    // Add UTF-8 BOM for proper excel Korean encoding
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `sessions_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className={'flex flex-col gap-4'}>
      {/* Control Bar */}
      <div className={'flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between'}>
        <div className={'flex flex-1 flex-col gap-3 md:flex-row md:items-center'}>
          {/* Search Input */}
          <div className={'relative flex-1 w-full'}>
            <MagnifyingGlassIcon className={'absolute left-3 top-1/2 size-5 -translate-y-1/2 text-neutral-400'} />
            <input
              type={'text'}
              placeholder={t.searchSessionPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={'w-full rounded-xl border border-neutral-200 py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900'}
            />
          </div>

          <div className={'flex flex-row items-center gap-2 w-full md:w-auto'}>
            {/* Part Filter */}
            <select
              value={selectedPart}
              onChange={(e) => setSelectedPart(e.target.value)}
              className={'w-full rounded-xl border border-neutral-200 p-2 text-sm outline-none transition-all focus:border-neutral-900 md:w-auto'}
            >
              <option value={'all'}>{t.allParts}</option>
              {uniqueParts.map((part) => (
                <option key={part} value={part}>
                  {part}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className={'flex items-center justify-between w-full md:w-auto gap-2 border-t border-neutral-100 pt-2 md:border-t-0 md:pt-0'}>
            <span className={'text-xs text-neutral-500 whitespace-nowrap'}>{t.sortBy}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={'rounded-xl border border-neutral-200 p-2 text-sm outline-none transition-all focus:border-neutral-900 w-full md:w-auto'}
            >
              <option value={'date-desc'}>{t.sortByDate} ({t.updatedAt})</option>
              <option value={'date-asc'}>{t.sortByDate} (▲)</option>
              <option value={'name'}>{t.sortByName}</option>
            </select>
          </div>
        </div>

        {/* CSV Export Button */}
        <button
          onClick={handleExportCsv}
          className={'flex w-full lg:w-auto items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-sm transition-all hover:bg-neutral-50 active:scale-95 border-t border-neutral-100 lg:border-t-0'}
        >
          <ArrowDownTrayIcon className={'size-4'} />
          <span>{t.exportCsv}</span>
        </button>
      </div>

      {/* Render Sessions List */}
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
                <div className={'border-b border-neutral-200 pb-1 text-sm font-semibold text-neutral-600'}>
                  {t.generation}: {group.generationName}
                </div>
              )}
              <div className={'member-data-grid w-full gap-4 pt-2'}>
                {group.sessions.map((session) => (
                  <SessionCard session={session} key={session.id} locale={locale} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
