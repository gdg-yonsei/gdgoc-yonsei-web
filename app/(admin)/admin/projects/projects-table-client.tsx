'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import AdminDataTable, {
  type AdminColumn,
} from '@/app/components/admin/data-table'
import AdminEmptyState from '@/app/components/admin/empty-state'
import { type AdminProjectListItem } from '@/lib/server/fetcher/admin/get-projects'
import { type AdminGenerationScope } from '@/lib/server/admin-generation-scope'
import {
  formatAdminDate,
  localizeAdminHref,
  type AdminMessages,
} from '@/lib/admin-i18n'
import { Locale } from '@/i18n-config'
import AdminTableToolbar from '@/app/(admin)/admin/_components/admin-table-toolbar'
import {
  downloadCsv,
  useFilteredSortedItems,
  useGroupedItems,
} from '@/app/(admin)/admin/_lib/admin-table-client'

interface ProjectsTableClientProps {
  projectsData: AdminProjectListItem[]
  scope: AdminGenerationScope | null
  locale: Locale
  t: AdminMessages
}

type ProjectGroup = {
  generationName: string
  generationId: number
  projects: AdminProjectListItem[]
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
  if (sortBy === 'name') {
    return left.name.localeCompare(right.name)
  }

  if (sortBy === 'created-desc') {
    return (
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    )
  }

  return (
    new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  )
}

function getProjectGroupKey(project: AdminProjectListItem) {
  return String(project.generationId)
}

function createProjectGroup(project: AdminProjectListItem): ProjectGroup {
  return {
    generationName: project.generationName ?? 'Unknown',
    generationId: project.generationId,
    projects: [],
  }
}

function addProjectToGroup(group: ProjectGroup, project: AdminProjectListItem) {
  group.projects.push(project)
}

function compareProjectGroups(left: ProjectGroup, right: ProjectGroup) {
  return right.generationId - left.generationId
}

export default function ProjectsTableClient({
  projectsData,
  scope,
  locale,
  t,
}: ProjectsTableClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('updated-desc')

  const filteredAndSortedProjects = useFilteredSortedItems({
    items: projectsData,
    searchQuery,
    sortBy,
    matchesSearch: projectMatchesSearch,
    compareItems: compareProjects,
  })
  const groupedProjects = useGroupedItems({
    items: filteredAndSortedProjects,
    getGroupKey: getProjectGroupKey,
    createGroup: createProjectGroup,
    addItem: addProjectToGroup,
    compareGroups: compareProjectGroups,
  })

  const columns = useMemo<AdminColumn<AdminProjectListItem>[]>(
    () => [
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
        render: (project) => project.generationName ?? '—',
      },
      {
        key: 'updated',
        header: t.columnUpdated,
        width: '9rem',
        render: (project) =>
          formatAdminDate(project.updatedAt, locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }),
      },
      {
        key: 'created',
        header: t.columnCreated,
        width: '9rem',
        hideOnMobile: true,
        render: (project) =>
          formatAdminDate(project.createdAt, locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }),
      },
    ],
    [t, locale, scope]
  )

  const handleExportCsv = () => {
    downloadCsv({
      filenamePrefix: 'projects',
      headers: [
        t.name,
        t.nameKo || '한글 이름',
        t.generation,
        t.createdAt,
        t.updatedAt,
      ],
      rows: filteredAndSortedProjects.map((project) => [
        project.name,
        project.nameKo,
        project.generationName,
        formatAdminDate(project.createdAt, locale, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }),
        formatAdminDate(project.updatedAt, locale, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }),
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

      {filteredAndSortedProjects.length === 0 ? (
        <AdminEmptyState
          title={t.noScopedResults}
          description={t.noScopedResultsHint}
        />
      ) : (
        <div className={'flex flex-col gap-6'}>
          {groupedProjects.map((group) => (
            <div key={group.generationName} className={'flex flex-col gap-2'}>
              {scope?.kind === 'all' && (
                <h2 className={'admin-field-label'}>
                  {t.generation}: {group.generationName}
                </h2>
              )}
              <AdminDataTable
                items={group.projects}
                caption={`${t.projects} — ${group.generationName}`}
                getKey={(project) => project.id}
                getHref={(project) =>
                  localizeAdminHref(`/admin/projects/${project.id}`, locale)
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
