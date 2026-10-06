import ProjectsTableClient from '@/app/(admin)/admin/projects/projects-table-client'
import type { AdminGenerationScope } from '@/lib/server/admin-generation-scope'
import { getProjects } from '@/lib/server/fetcher/admin/get-projects'

export default async function ProjectsTable({
  scope,
}: {
  scope: AdminGenerationScope | null
}) {
  const projectsData = await getProjects(scope)

  return <ProjectsTableClient projectsData={projectsData} scope={scope} />
}
