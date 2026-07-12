import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import DataForm from '@/app/components/data-form'
import SubmitButton from '@/app/components/admin/submit-button'
import { createProjectAction } from '@/app/(admin)/admin/projects/create/actions'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import DataInput from '@/app/components/admin/data-input'
import MembersSelectInput from '@/app/components/admin/member-select-input'
import { getMembers } from '@/lib/server/fetcher/admin/get-members'
import { Metadata } from 'next'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'
import { auth } from '@/auth'
import { resolveAdminGenerationScope } from '@/lib/server/admin-generation-scope'
import ResourceImageFields from '@/app/components/admin/resource-image-fields'
import GenerationField from '@/app/components/admin/generation-field'
import {
  BilingualInputField,
  BilingualMdxField,
  BilingualTextareaField,
} from '@/app/components/admin/bilingual-fields'
import { dedupeById } from '@/lib/admin/member-options'

export const metadata: Metadata = {
  title: 'Create Project',
}

export default async function CreateProjectPage() {
  const [locale, session] = await Promise.all([getAdminLocale(), auth()])
  const t = getAdminMessages(locale)
  const resolvedScope = session?.user?.id
    ? await resolveAdminGenerationScope(session.user.id)
    : null

  if (
    resolvedScope?.scope?.kind !== 'generation' ||
    !resolvedScope.selectedGeneration
  ) {
    return (
      <AdminDefaultLayout>
        <AdminNavigationButton href={'/admin/projects'}>
          <ChevronLeftIcon className={'size-8'} />
          <p className={'text-lg'}>{t.projects}</p>
        </AdminNavigationButton>
        <div className={'admin-title'}>
          {t.create} {t.project}
        </div>
        <div className={'rounded-2xl bg-white p-6 text-neutral-700'}>
          <div className={'font-semibold'}>
            {t.selectSpecificGenerationToCreate}
          </div>
        </div>
      </AdminDefaultLayout>
    )
  }

  const membersList = await getMembers(null)
  const uniqueMembers = dedupeById(membersList)

  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={'/admin/projects'}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>{t.projects}</p>
      </AdminNavigationButton>
      <div className={'admin-title'}>
        {t.create} {t.project}
      </div>
      <DataForm
        action={createProjectAction}
        className={'member-data-grid gap-2'}
      >
        <ResourceImageFields
          mainImageBaseUrl={'/api/admin/projects/main-image'}
          contentImageBaseUrl={'/api/admin/projects/content-image'}
          t={t}
        />
        <BilingualInputField
          t={t}
          fieldLabel={t.name}
          enName={'name'}
          koName={'nameKo'}
          enTitle={t.nameEn}
          koTitle={t.nameKo}
          enPlaceholder={t.nameEn}
          koPlaceholder={t.nameKo}
        />
        <BilingualTextareaField
          t={t}
          fieldLabel={t.description}
          enName={'description'}
          koName={'descriptionKo'}
          enPlaceholder={t.descriptionEn}
          koPlaceholder={t.descriptionKo}
        />
        <DataInput
          title={'Repository URL'}
          defaultValue={null}
          name={'repoUrl'}
          placeholder={'https://github.com/gdg-yonsei/...'}
          type={'url'}
        />
        <DataInput
          title={'Demo URL'}
          defaultValue={null}
          name={'demoUrl'}
          placeholder={'https://...'}
          type={'url'}
        />
        <GenerationField
          title={t.generation}
          value={resolvedScope.selectedGeneration.name}
          inputName={'generationId'}
          inputValue={resolvedScope.selectedGeneration.id}
        />
        <MembersSelectInput members={uniqueMembers} defaultValue={[]} />
        <BilingualMdxField
          t={t}
          fieldLabel={t.content}
          enName={'content'}
          koName={'contentKo'}
          enTitle={t.contentEn}
          koTitle={t.contentKo}
          enPlaceholder={'Write the project content in English.'}
          koPlaceholder={'프로젝트 내용을 한국어로 작성하세요.'}
        />
        <SubmitButton />
      </DataForm>
    </AdminDefaultLayout>
  )
}
