import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import { getProject } from '@/lib/server/fetcher/admin/get-project'
import { notFound } from 'next/navigation'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { updateProjectAction } from '@/app/(admin)/admin/projects/[projectId]/edit/actions'
import DataForm from '@/app/components/admin/data-form'
import SubmitButton from '@/app/components/admin/submit-button'
import { getMembers } from '@/lib/server/fetcher/admin/get-members'
import { getTagNames } from '@/lib/server/services/admin/project-tags'
import { Metadata } from 'next'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'
import { requirePermission } from '@/lib/server/permission/require-permission'
import {
  resolveAdminGenerationScope,
  canSwitchToGeneration,
} from '@/lib/server/admin-generation-scope'
import AdminGenerationScopeMismatchNotice from '@/app/components/admin/admin-generation-scope-mismatch-notice'
import { dedupeById } from '@/lib/admin/member-options'
import { savedVersionKey } from '@/lib/admin/form-version'
import ProjectFormFields from '@/app/(admin)/admin/projects/_components/project-form-fields'
import { connection } from 'next/server'

export const metadata: Metadata = {
  title: 'Edit Project',
}

export default async function EditProjectPage({
  params,
}: PageProps<'/admin/projects/[projectId]/edit'>) {
  await connection()
  const [{ projectId }, locale] = await Promise.all([params, getAdminLocale()])
  const t = getAdminMessages(locale)
  const projectData = await getProject(projectId)

  if (!projectData) {
    notFound()
  }

  const session = await requirePermission(
    'put',
    'projects',
    projectData.authorId
  )

  const updateProjectActionWithProjectId = updateProjectAction.bind(
    null,
    projectId
  )

  const [resolvedScope, membersList, tagNames] = await Promise.all([
    session?.user?.id
      ? resolveAdminGenerationScope(session.user.id)
      : Promise.resolve(null),
    getMembers(null),
    getTagNames(),
  ])
  const actualGeneration = projectData.generation
    ? {
        id: projectData.generation.id,
        name: projectData.generation.name,
      }
    : null

  return (
    <AdminDefaultLayout>
      {actualGeneration && (
        <AdminGenerationScopeMismatchNotice
          actualGeneration={actualGeneration}
          canSwitch={canSwitchToGeneration(resolvedScope, actualGeneration.id)}
          currentScope={resolvedScope?.scope ?? null}
          locale={locale}
        />
      )}
      <AdminNavigationButton href={`/admin/projects/${projectId}`}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>
          {projectData.name} {t.project}
        </p>
      </AdminNavigationButton>
      <div className={'admin-title py-4'}>
        {t.edit} {projectData.name} {t.project}
      </div>
      {/* 저장된 버전마다 key를 바꿔, 저장 후 돌아왔을 때 이전 편집 내용 대신 저장된 값을 보여 준다. */}
      <DataForm
        key={savedVersionKey(projectData.updatedAt)}
        action={updateProjectActionWithProjectId}
        className={'admin-form-grid w-full gap-4'}
      >
        <ProjectFormFields
          t={t}
          generation={{
            id: actualGeneration?.id ?? projectData.generationId,
            name: actualGeneration?.name,
          }}
          members={dedupeById(membersList)}
          tagNames={tagNames}
          project={projectData}
        />
        <SubmitButton />
      </DataForm>
    </AdminDefaultLayout>
  )
}
