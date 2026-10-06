'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { AdminColumn } from '@/app/components/admin/data-table'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import AdminTableToolbar from '@/app/(admin)/admin/_components/admin-table-toolbar'
import GenerationGroupedTables from '@/app/(admin)/admin/_components/generation-grouped-tables'
import {
  downloadCsv,
  filterAndSortItems,
  groupByGeneration,
} from '@/app/(admin)/admin/_lib/admin-table-client'
import { formatAdminDate, localizeAdminHref } from '@/lib/admin-i18n'
import type { Locale } from '@/lib/i18n'
import type { AdminGenerationScope } from '@/lib/server/admin-generation-scope'
import type { AdminProjectListItem } from '@/lib/server/fetcher/admin/get-projects'

/** 생성·수정 시각은 실제 시각이므로 서울 시간으로 날짜만 보여 준다. */
function formatSeoulDate(value: Date | string, locale: Locale) {
  return formatAdminDate(value, locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Seoul',
  })
}

function projectMatchesSearch(project: AdminProjectListItem, query: string) {
  return (
    project.name.toLowerCase().includes(query) ||
    (project.nameKo?.toLowerCase().includes(query) ?? false)
  )
}

function compareProjects(
  left: AdminProjectListItem,
  right: AdminProjectListItem,
  sortBy: string
) {
  if (sortBy === 'name') return left.name.localeCompare(right.name)

  const field = sortBy === 'created-desc' ? 'createdAt' : 'updatedAt'
  return new Date(right[field]).getTime() - new Date(left[field]).getTime()
}

export default function ProjectsTableClient({
  projectsData,
  scope,
}: {
  projectsData: AdminProjectListItem[]
  scope: AdminGenerationScope | null
}) {
  const { locale, messages: t } = useAdminI18n()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('updated-desc')

  const filteredProjects = filterAndSortItems({
    items: projectsData,
    searchQuery,
    sortBy,
    matchesSearch: projectMatchesSearch,
    compareItems: compareProjects,
  })
  const groups = groupByGeneration(filteredProjects, (project) => ({
    id: project.generationId,
    name: project.generationName,
  }))

  const columns: AdminColumn<AdminProjectListItem>[] = [
    {
      key: 'name',
      header: t.columnName,
      width: 'minmax(0,2.5fr)',
      primary: true,
      render: (project) => (
        <span className={'flex min-w-0 items-center gap-3'}>
          <Image
            src={project.mainImage}
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
            <span className={'truncate'}>{project.name}</span>
            {project.nameKo && (
              <span className={'type-eyebrow text-ink-muted truncate'}>
                {project.nameKo}
              </span>
            )}
          </span>
        </span>
      ),
    },
    {
      key: 'generation',
      header: t.columnGeneration,
      width: '8rem',
      hideOnMobile: scope?.kind !== 'all',
      render: (project) => project.generationName ?? t.notProvided,
    },
    {
      key: 'updated',
      header: t.columnUpdated,
      width: '9rem',
      render: (project) => formatSeoulDate(project.updatedAt, locale),
    },
    {
      key: 'created',
      header: t.columnCreated,
      width: '9rem',
      hideOnMobile: true,
      render: (project) => formatSeoulDate(project.createdAt, locale),
    },
  ]

  const handleExportCsv = () => {
    downloadCsv({
      filenamePrefix: 'projects',
      headers: [t.name, t.nameKo, t.generation, t.createdAt, t.updatedAt],
      rows: filteredProjects.map((project) => [
        project.name,
        project.nameKo,
        project.generationName,
        formatSeoulDate(project.createdAt, locale),
        formatSeoulDate(project.updatedAt, locale),
      ]),
    })
  }

  return (
    <div className={'flex flex-col gap-4'}>
      <AdminTableToolbar
        searchValue={searchQuery}
        searchPlaceholder={t.searchProjectPlaceholder}
        onSearchChange={setSearchQuery}
        exportLabel={t.exportCsv}
        onExportCsv={handleExportCsv}
        sortControl={{
          id: 'sort',
          label: t.sortBy,
          value: sortBy,
          onChange: setSortBy,
          options: [
            { value: 'updated-desc', label: t.sortByUpdated },
            { value: 'created-desc', label: t.sortByCreated },
            { value: 'name', label: t.sortByName },
          ],
        }}
      />
      <GenerationGroupedTables
        groups={groups}
        showGenerationHeadings={scope?.kind === 'all'}
        captionLabel={t.projects}
        columns={columns}
        getKey={(project) => project.id}
        getHref={(project) =>
          localizeAdminHref(`/admin/projects/${project.id}`, locale)
        }
      />
    </div>
  )
}
