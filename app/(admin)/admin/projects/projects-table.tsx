import { getProjects } from '@/lib/server/fetcher/admin/get-projects'
import { type AdminGenerationScope } from '@/lib/server/admin-generation-scope'
import { type AdminMessages } from '@/lib/admin-i18n'
import { type Locale } from '@/i18n-config'
import ProjectsTableClient from './projects-table-client'

export default async function ProjectsTable({
  scope,
  locale,
  t,
}: {
  scope: AdminGenerationScope | null
  locale: Locale
  t: AdminMessages
}) {
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
