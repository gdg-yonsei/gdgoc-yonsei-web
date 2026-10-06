import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import { notFound } from 'next/navigation'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import DataForm from '@/app/components/admin/data-form'
import SubmitButton from '@/app/components/admin/submit-button'
import { updateSessionAction } from '@/app/(admin)/admin/sessions/[sessionId]/edit/actions'
import { getSession } from '@/lib/server/fetcher/admin/get-session'
import { Metadata } from 'next'
import { getMembers } from '@/lib/server/fetcher/admin/get-members'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'
import { requirePermission } from '@/lib/server/permission/require-permission'
import {
  resolveAdminGenerationScope,
  canSwitchToGeneration,
} from '@/lib/server/admin-generation-scope'
import AdminGenerationScopeMismatchNotice from '@/app/components/admin/admin-generation-scope-mismatch-notice'
import { getGeneration } from '@/lib/server/fetcher/admin/get-generation'
import { groupMemberships } from '@/lib/admin/member-options'
import { savedVersionKey } from '@/lib/admin/form-version'
import SessionFormFields, {
  toSessionPartOptions,
} from '@/app/(admin)/admin/sessions/_components/session-form-fields'
import { connection } from 'next/server'

export const metadata: Metadata = {
  title: 'Edit Session',
}

export default async function EditSessionPage({
  params,
}: PageProps<'/admin/sessions/[sessionId]/edit'>) {
  await connection()
  const [{ sessionId }, locale] = await Promise.all([params, getAdminLocale()])
  const t = getAdminMessages(locale)
  const sessionData = await getSession(sessionId)

  if (!sessionData) {
    notFound()
  }

  const session = await requirePermission(
    'put',
    'sessions',
    sessionData.authorId
  )

  const updateSessionActionWithSessionId = updateSessionAction.bind(
    null,
    sessionId
  )

  const actualGeneration = sessionData.part?.generation
    ? {
        id: sessionData.part.generation.id,
        name: sessionData.part.generation.name,
      }
    : null
  const [resolvedScope, generationData, membersData] = await Promise.all([
    session?.user?.id
      ? resolveAdminGenerationScope(session.user.id)
      : Promise.resolve(null),
    actualGeneration
      ? getGeneration(actualGeneration.id)
      : Promise.resolve(null),
    getMembers(null),
  ])

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
      <AdminNavigationButton href={`/admin/sessions/${sessionId}`}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>
          {sessionData.name} {t.session}
        </p>
      </AdminNavigationButton>
      <div className={'admin-title py-4'}>
        {t.edit} {sessionData.name} {t.session}
      </div>
      {/* 저장된 버전마다 key를 바꿔, 저장 후 돌아왔을 때 이전 편집 내용 대신 저장된 값을 보여 준다. */}
      <DataForm
        key={savedVersionKey(sessionData.updatedAt)}
        action={updateSessionActionWithSessionId}
        className={'admin-form-grid w-full gap-4'}
      >
        <SessionFormFields
          t={t}
          generationName={actualGeneration?.name}
          members={groupMemberships(membersData)}
          parts={toSessionPartOptions(generationData)}
          session={sessionData}
        />
        <SubmitButton />
      </DataForm>
    </AdminDefaultLayout>
  )
}
