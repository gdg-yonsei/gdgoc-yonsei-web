/**
 * 세션 생성 화면(`/admin/sessions/create`). 권한은 레이아웃이 확인한다.
 */
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import DataForm from '@/app/components/admin/data-form'
import { createSessionAction } from '@/app/(admin)/admin/sessions/create/actions'
import SubmitButton from '@/app/components/admin/submit-button'
import { Metadata } from 'next'
import { getMembers } from '@/lib/server/fetcher/admin/get-members'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'
import { getAuthSession } from '@/auth'
import { resolveAdminGenerationScope } from '@/lib/server/admin-generation-scope'
import { getGeneration } from '@/lib/server/fetcher/admin/get-generation'
import { groupMemberships } from '@/lib/admin/member-options'
import SessionFormFields, {
  toSessionPartOptions,
} from '@/app/(admin)/admin/sessions/_components/session-form-fields'

/** 브라우저 탭 제목. */
export const metadata: Metadata = {
  title: 'Create Session',
}

/** 세션 생성 폼. */
export default async function CreateSessionPage() {
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
        <AdminNavigationButton href={'/admin/sessions'}>
          <ChevronLeftIcon className={'size-8'} />
          <p className={'text-lg'}>{t.sessions}</p>
        </AdminNavigationButton>
        <div className={'admin-title'}>{t.createSession}</div>
        <div className={'admin-panel'}>
          <div className={'font-semibold'}>
            {t.selectSpecificGenerationToCreate}
          </div>
        </div>
      </AdminDefaultLayout>
    )
  }

  const [generationData, membersData] = await Promise.all([
    getGeneration(resolvedScope.selectedGeneration.id),
    getMembers(null),
  ])

  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={'/admin/sessions'}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>{t.sessions}</p>
      </AdminNavigationButton>
      <div className={'admin-title'}>{t.createSession}</div>
      <DataForm
        action={createSessionAction}
        className={'admin-form-grid gap-2'}
      >
        <SessionFormFields
          t={t}
          generationName={resolvedScope.selectedGeneration.name}
          members={groupMemberships(membersData)}
          parts={toSessionPartOptions(generationData)}
        />
        <SubmitButton />
      </DataForm>
    </AdminDefaultLayout>
  )
}
