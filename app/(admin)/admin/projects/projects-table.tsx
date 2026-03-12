import {
  getProjects,
  type AdminProjectListItem,
} from '@/lib/server/fetcher/admin/get-projects'
import Link from 'next/link'
import Image from 'next/image'
import { type AdminGenerationScope } from '@/lib/server/admin-generation-scope'
import {
  formatAdminDate,
  getAdminLocale,
  getAdminMessages,
  localizeAdminHref,
} from '@/lib/admin-i18n/server'

/**
 * 프로젝트 정보 표시 테이블
 * @constructor
 */
function groupProjectsByGeneration(projectsData: AdminProjectListItem[]) {
  return Object.values(
    projectsData.reduce<Record<string, { generationName: string; projects: AdminProjectListItem[] }>>(
      (groups, project) => {
        const key = String(project.generationId)
        if (!groups[key]) {
          groups[key] = {
            generationName: project.generationName ?? 'Unknown',
            projects: [],
          }
        }

        groups[key].projects.push(project)
        return groups
      },
      {}
    )
  )
}

export default async function ProjectsTable({
  scope,
}: {
  scope: AdminGenerationScope | null
}) {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  // 프로젝트 데이터 가져오기
  const projectsData = await getProjects(scope)

  if (projectsData.length === 0) {
    return (
      <div className={'rounded-2xl bg-white p-6 text-neutral-700'}>
        <div className={'font-semibold'}>{t.noScopedResults}</div>
        <div className={'pt-1 text-sm text-neutral-500'}>
          {t.noScopedResultsHint}
        </div>
      </div>
    )
  }

  const groupedProjects = groupProjectsByGeneration(projectsData)

  return (
    <div className={'flex flex-col gap-4'}>
      {groupedProjects.map((group) => (
        <div key={group.generationName}>
          {scope?.kind === 'all' && (
            <div
              className={'border-b-2 border-neutral-300 pb-1 text-sm text-neutral-600'}
            >
              {t.generation}: {group.generationName}
            </div>
          )}
          <div className={'member-data-grid w-full gap-2 pt-2'}>
            {group.projects.map((project) => (
              <Link
                href={localizeAdminHref(`/admin/projects/${project.id}`, locale)}
                key={project.id}
                className={'flex flex-col rounded-xl bg-white'}
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
                  <div className={'text-xl font-semibold'}>{project.name}</div>
                  <div className={'pb-4 text-lg font-semibold text-neutral-700'}>
                    {project.nameKo}
                  </div>
                  <div className={'flex flex-col text-sm'}>
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
  )
}
