import { getProjects } from '@/lib/fetcher/get-projects'

/**
 * 프로젝트 정보 표시 테이블
 * @constructor
 */
export default async function ProjectsTable() {
  // 프로젝트 데이터 가져오기
  const projectsData = await getProjects()

  return (
    <div className={'w-full flex flex-col gap-2'}>
      {projectsData.map((project) => (
        <div key={project.id}>{project.name}</div>
      ))}
    </div>
  )
}
