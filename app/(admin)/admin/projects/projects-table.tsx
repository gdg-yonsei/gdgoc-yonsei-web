import { getProjects } from '@/lib/fetcher/admin/get-projects'
import Link from 'next/link'
import Image from 'next/image'

/**
 * 프로젝트 정보 표시 테이블
 * @constructor
 */
export default async function ProjectsTable() {
  // 프로젝트 데이터 가져오기
  const projectsData = await getProjects()

  return (
    <div className={'member-data-grid w-full gap-2'}>
      {projectsData.map((project) => (
        <Link
          href={`/admin/projects/${project.id}`}
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
            <div className={'pb-4 text-xl font-semibold'}>{project.name}</div>
            <div className={'flex flex-col text-sm'}>
              <div>
                Created At:{' '}
                {new Intl.DateTimeFormat('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }).format(new Date(project.createdAt))}
              </div>
              <div>
                Updated At:{' '}
                {new Intl.DateTimeFormat('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }).format(new Date(project.updatedAt))}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
