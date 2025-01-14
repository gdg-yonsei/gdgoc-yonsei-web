import { getProjects } from '@/lib/fetcher/get-projects'
import Link from 'next/link'

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
          className={'p-4 rounded-xl bg-white flex flex-col items-center'}
        >
          <div className={'text-xl font-semibold pb-4'}>{project.name}</div>
          <div className={'flex text-sm flex-col'}>
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
        </Link>
      ))}
    </div>
  )
}
