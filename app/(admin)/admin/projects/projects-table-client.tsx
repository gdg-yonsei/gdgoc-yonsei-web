'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MagnifyingGlassIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { type AdminProjectListItem } from '@/lib/server/fetcher/admin/get-projects'
import { type AdminGenerationScope } from '@/lib/server/admin-generation-scope'
import { formatAdminDate, localizeAdminHref, type AdminMessages } from '@/lib/admin-i18n'
import { Locale } from '@/i18n-config'

interface ProjectsTableClientProps {
  projectsData: AdminProjectListItem[]
  scope: AdminGenerationScope | null
  locale: Locale
  t: AdminMessages
}

export default function ProjectsTableClient({
  projectsData,
  scope,
  locale,
  t,
}: ProjectsTableClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('updated-desc') // updated-desc | created-desc | name

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let result = [...projectsData]

    // 1. Search Query filter (Ko, En names)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (project) =>
          project.name.toLowerCase().includes(q) ||
          (project.nameKo && project.nameKo.toLowerCase().includes(q))
      )
    }

    // 2. Sort
    result.sort((left, right) => {
      if (sortBy === 'name') {
        return left.name.localeCompare(right.name)
      } else if (sortBy === 'created-desc') {
        const leftTime = new Date(left.createdAt).getTime()
        const rightTime = new Date(right.createdAt).getTime()
        return rightTime - leftTime
      } else {
        // updated-desc (default)
        const leftTime = new Date(left.updatedAt).getTime()
        const rightTime = new Date(right.updatedAt).getTime()
        return rightTime - leftTime
      }
    })

    return result
  }, [projectsData, searchQuery, sortBy])

  // Group filtered results by generation
  const groupedProjects = useMemo(() => {
    return Object.values(
      filteredAndSortedProjects.reduce<
        Record<
          string,
          { generationName: string; projects: AdminProjectListItem[] }
        >
      >((groups, project) => {
        const key = String(project.generationId)
        if (!groups[key]) {
          groups[key] = {
            generationName: project.generationName ?? 'Unknown',
            projects: [],
          }
        }
        groups[key].projects.push(project)
        return groups
      }, {})
    ).sort((left, right) => {
      const leftId = left.projects[0]?.generationId ?? 0
      const rightId = right.projects[0]?.generationId ?? 0
      return rightId - leftId
    })
  }, [filteredAndSortedProjects])

  // CSV Export function
  const handleExportCsv = () => {
    const headers = [
      t.name,
      t.nameKo || '한글 이름',
      t.generation,
      t.createdAt,
      t.updatedAt,
    ]

    const csvRows = [headers.join(',')]

    filteredAndSortedProjects.forEach((project) => {
      const createdText = formatAdminDate(project.createdAt, locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })

      const updatedText = formatAdminDate(project.updatedAt, locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })

      const row = [
        `"${project.name.replace(/"/g, '""')}"`,
        `"${(project.nameKo || '').replace(/"/g, '""')}"`,
        `"${(project.generationName || '').replace(/"/g, '""')}"`,
        `"${createdText.replace(/"/g, '""')}"`,
        `"${updatedText.replace(/"/g, '""')}"`,
      ]
      csvRows.push(row.join(','))
    })

    const csvContent = csvRows.join('\n')
    // Add UTF-8 BOM for proper excel Korean encoding
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `projects_${new Date().toISOString().split('T')[0]}.csv`)
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
              placeholder={t.searchProjectPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={'w-full rounded-xl border border-neutral-200 py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900'}
            />
          </div>

          {/* Sort By */}
          <div className={'flex items-center justify-between w-full md:w-auto gap-2 border-t border-neutral-100 pt-2 md:border-t-0 md:pt-0'}>
            <span className={'text-xs text-neutral-500 whitespace-nowrap'}>{t.sortBy}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={'rounded-xl border border-neutral-200 p-2 text-sm outline-none transition-all focus:border-neutral-900 w-full md:w-auto'}
            >
              <option value={'updated-desc'}>{t.sortByUpdated}</option>
              <option value={'created-desc'}>{t.sortByCreated}</option>
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

      {/* Render Projects List */}
      {filteredAndSortedProjects.length === 0 ? (
        <div className={'rounded-2xl bg-white p-6 text-neutral-700 shadow-sm'}>
          <div className={'font-semibold'}>{t.noScopedResults}</div>
          <div className={'pt-1 text-sm text-neutral-500'}>
            {t.noScopedResultsHint}
          </div>
        </div>
      ) : (
        <div className={'flex flex-col gap-6'}>
          {groupedProjects.map((group) => (
            <div key={group.generationName} className={'flex flex-col gap-2'}>
              {scope?.kind === 'all' && (
                <div className={'border-b border-neutral-200 pb-1 text-sm font-semibold text-neutral-600'}>
                  {t.generation}: {group.generationName}
                </div>
              )}
              <div className={'member-data-grid w-full gap-4 pt-2'}>
                {group.projects.map((project) => (
                  <Link
                    href={localizeAdminHref(`/admin/projects/${project.id}`, locale)}
                    key={project.id}
                    className={'flex flex-col rounded-xl bg-white border border-neutral-100 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md'}
                  >
                    <Image
                      src={project.mainImage}
                      alt={'Main Image'}
                      width={600}
                      height={400}
                      className={'aspect-3/2 w-full rounded-t-xl object-cover'}
                      placeholder={'blur'}
                      blurDataURL={'/default-image.png'}
                    />

                    <div className={'p-4'}>
                      <div className={'text-xl font-semibold text-neutral-900'}>{project.name}</div>
                      {project.nameKo && (
                        <div className={'pb-4 text-base font-medium text-neutral-600'}>
                          {project.nameKo}
                        </div>
                      )}
                      <div className={'flex flex-col gap-0.5 text-xs text-neutral-500'}>
                        <div>
                          {t.createdAt}:{' '}
                          {formatAdminDate(project.createdAt, locale, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                        <div>
                          {t.updatedAt}:{' '}
                          {formatAdminDate(project.updatedAt, locale, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
