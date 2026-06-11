import {
  getProjects,
} from '@/lib/server/fetcher/admin/get-projects'
import { type AdminGenerationScope } from '@/lib/server/admin-generation-scope'
import {
  getAdminLocale,
  getAdminMessages,
} from '@/lib/admin-i18n/server'
import ProjectsTableClient from './projects-table-client'

export default async function ProjectsTable({
  scope,
}: {
  scope: AdminGenerationScope | null
}) {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  // 프로젝트 데이터 가져오기
  const projectsData = await getProjects(scope)

  return (
    <ProjectsTableClient
      projectsData={projectsData}
      scope={scope}
      locale={locale}
      t={t}
    />
  )
}

