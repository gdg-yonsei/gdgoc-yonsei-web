'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
                <div
                  className={
                    'border-b border-neutral-200 pb-1 text-sm font-semibold text-neutral-600'
                  }
                >
                  {t.generation}: {group.generationName}
                </div>
              )}
              <div className={'member-data-grid w-full gap-4 pt-2'}>
                {group.projects.map((project) => (
                  <Link
                    href={localizeAdminHref(
                      `/admin/projects/${project.id}`,
                      locale
                    )}
                    key={project.id}
                    className={
                      'flex flex-col rounded-xl border border-neutral-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md'
                    }
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
                      <div className={'text-xl font-semibold text-neutral-900'}>
                        {project.name}
                      </div>
                      {project.nameKo && (
                        <div
                          className={
                            'pb-4 text-base font-medium text-neutral-600'
                          }
                        >
                          {project.nameKo}
                        </div>
                      )}
                      <div
                        className={
                          'flex flex-col gap-0.5 text-xs text-neutral-500'
                        }
                      >
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
