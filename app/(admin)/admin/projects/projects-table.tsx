import { getProjects } from '@/lib/server/fetcher/admin/get-projects'
import Link from 'next/link'
import Image from 'next/image'
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
export default async function ProjectsTable() {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  // 프로젝트 데이터 가져오기
  const projectsData = await getProjects()

  return (
    <div className={'member-data-grid w-full gap-2'}>
      {projectsData.map((project) => (
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
            <div className={'pb-4 text-xl font-semibold'}>{project.nameKo}</div>
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
  )
}
