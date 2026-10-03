/**
 * 프로젝트 생성 화면(`/admin/projects/create`). 권한은 레이아웃이 확인한다.
 */
import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import DataForm from '@/app/components/admin/data-form'
import SubmitButton from '@/app/components/admin/submit-button'
import { createProjectAction } from '@/app/(admin)/admin/projects/create/actions'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { getMembers } from '@/lib/server/fetcher/admin/get-members'
import { getTagNames } from '@/lib/server/services/admin/project-tags'
import { Metadata } from 'next'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'
import { getAuthSession } from '@/auth'
import { resolveAdminGenerationScope } from '@/lib/server/admin-generation-scope'
import { dedupeById } from '@/lib/admin/member-options'
import ProjectFormFields from '@/app/(admin)/admin/projects/_components/project-form-fields'

/** 브라우저 탭 제목. */
export const metadata: Metadata = {
  title: 'Create Project',
}

/** 프로젝트 생성 폼. */
export default async function CreateProjectPage() {
  const [locale, session] = await Promise.all([
    getAdminLocale(),
    getAuthSession(),
  ])
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
        <div className={'admin-panel'}>
          <div className={'font-semibold'}>
            {t.selectSpecificGenerationToCreate}
          </div>
        </div>
      </AdminDefaultLayout>
    )
  }

  const [membersList, tagNames] = await Promise.all([
    getMembers(null),
    getTagNames(),
  ])

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
        className={'admin-form-grid gap-2'}
      >
        <ProjectFormFields
          t={t}
          generation={resolvedScope.selectedGeneration}
          members={dedupeById(membersList)}
          tagNames={tagNames}
        />
        <SubmitButton />
      </DataForm>
    </AdminDefaultLayout>
  )
}
