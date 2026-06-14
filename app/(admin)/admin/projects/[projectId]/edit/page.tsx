import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import { getProject } from '@/lib/server/fetcher/admin/get-project'
import { notFound } from 'next/navigation'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { updateProjectAction } from '@/app/(admin)/admin/projects/[projectId]/edit/actions'
import DataForm from '@/app/components/data-form'
import SubmitButton from '@/app/components/admin/submit-button'
import MembersSelectInput from '@/app/components/admin/member-select-input'
import { getMembers } from '@/lib/server/fetcher/admin/get-members'
import { Metadata } from 'next'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'
import { auth } from '@/auth'
import { resolveAdminGenerationScope } from '@/lib/server/admin-generation-scope'
import AdminGenerationScopeMismatchNotice from '@/app/components/admin/admin-generation-scope-mismatch-notice'
import ResourceImageFields from '@/app/components/admin/resource-image-fields'
import GenerationField from '@/app/components/admin/generation-field'
import {
  BilingualInputField,
  BilingualMdxField,
} from '@/app/components/admin/bilingual-fields'
import { dedupeById } from '@/lib/admin/member-options'
import { connection } from 'next/server'

export const metadata: Metadata = {
  title: 'Edit Project',
}

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  await connection()
  const [{ projectId }, locale] = await Promise.all([params, getAdminLocale()])
  const t = getAdminMessages(locale)
  const [projectData, session] = await Promise.all([
    getProject(projectId),
    auth(),
  ])

  if (!projectData) {
    notFound()
  }

  const updateProjectActionWithProjectId = updateProjectAction.bind(
    null,
    projectId
  )

  const [resolvedScope, membersList] = await Promise.all([
    session?.user?.id
      ? resolveAdminGenerationScope(session.user.id)
      : Promise.resolve(null),
    getMembers(null),
  ])
  const actualGeneration = projectData.generation
    ? {
        id: projectData.generation.id,
        name: projectData.generation.name,
      }
    : null
  const uniqueMembers = dedupeById(membersList)

  return (
    <AdminDefaultLayout>
      {actualGeneration && (
        <AdminGenerationScopeMismatchNotice
          actualGeneration={actualGeneration}
          canSwitch={
            resolvedScope?.canAccessAll === true ||
            resolvedScope?.options.some(
              (option) => option.id === actualGeneration.id
            ) === true
          }
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
      <DataForm
        action={updateProjectActionWithProjectId}
        className={'member-data-grid w-full gap-4'}
      >
        <BilingualInputField
          t={t}
          fieldLabel={t.name}
          enName={'name'}
          koName={'nameKo'}
          enTitle={t.nameEn}
          koTitle={t.nameKo}
          enPlaceholder={t.nameEn}
          koPlaceholder={t.nameKo}
          enDefaultValue={projectData.name}
          koDefaultValue={projectData.nameKo}
        />
        <BilingualInputField
          t={t}
          fieldLabel={t.description}
          enName={'description'}
          koName={'descriptionKo'}
          enTitle={t.descriptionEn}
          koTitle={t.descriptionKo}
          enPlaceholder={t.descriptionEn}
          koPlaceholder={t.descriptionKo}
          enDefaultValue={projectData.description}
          koDefaultValue={projectData.descriptionKo}
        />
        <GenerationField
          title={t.generation}
          value={actualGeneration?.name}
          inputName={'generationId'}
          inputValue={actualGeneration?.id ?? projectData.generationId}
        />
        <MembersSelectInput
          defaultValue={projectData.usersToProjects.map((user) => user.userId)}
          members={uniqueMembers}
        />
        <ResourceImageFields
          mainImageBaseUrl={'/api/admin/projects/main-image'}
          contentImageBaseUrl={'/api/admin/projects/content-image'}
          mainImageDefaultValue={projectData.mainImage}
          contentImagesDefaultValue={projectData.images.map((image) => image)}
          t={t}
        />
        <BilingualMdxField
          t={t}
          fieldLabel={t.content}
          enName={'content'}
          koName={'contentKo'}
          enTitle={t.contentEn}
          koTitle={t.contentKo}
          enPlaceholder={'Please write content'}
          koPlaceholder={'한국어 본문을 작성하세요.'}
          enDefaultValue={projectData.content}
          koDefaultValue={projectData.contentKo}
        />
        <SubmitButton />
      </DataForm>
    </AdminDefaultLayout>
  )
}
