/**
 * 프로젝트 목록 서버 래퍼. 데이터를 읽어 클라이언트 표에 넘긴다.
 */
import ProjectsTableClient from '@/app/(admin)/admin/projects/projects-table-client'
import type { AdminGenerationScope } from '@/lib/server/admin-generation-scope'
import { getProjects } from '@/lib/server/fetcher/admin/get-projects'

/**
 * 목록 데이터를 서버에서 읽어 클라이언트 표에 넘기는 래퍼.
 * 페이지가 Suspense로 감싸 데이터가 오는 동안 스켈레톤을 보여 준다.
 */
export default async function ProjectsTable({
  scope,
}: {
  scope: AdminGenerationScope | null
}) {
  const projectsData = await getProjects(scope)

  return <ProjectsTableClient projectsData={projectsData} scope={scope} />
}
