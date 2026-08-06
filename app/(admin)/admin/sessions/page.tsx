import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import {
  AdminCardSkeleton,
  AdminTableSkeleton,
} from '@/app/components/admin/skeleton'
import AdminPageHeader from '@/app/components/admin/page-header'
import { auth } from '@/auth'
import handlePermission from '@/lib/server/permission/handle-permission'
import Link from 'next/link'
import { PlusCircleIcon } from '@heroicons/react/24/outline'
import SessionsTable from '@/app/(admin)/admin/sessions/sessions-table'
import { Suspense } from 'react'
import { Metadata } from 'next'
import UpcomingSessions from '@/app/(admin)/admin/sessions/upcoming-sessions'
import RegisterSession from '@/app/(admin)/admin/sessions/register-session'
import {
  getAdminLocale,
  getAdminMessages,
  localizeAdminHref,
} from '@/lib/admin-i18n/server'
import { resolveAdminGenerationScope } from '@/lib/server/admin-generation-scope'

export const metadata: Metadata = {
  title: 'Sessions',
}

export default async function SessionsPage() {
  const [locale, session] = await Promise.all([getAdminLocale(), auth()])
  const t = getAdminMessages(locale)
  const userId = session?.user?.id
  const [canCreate, resolvedScope] = await Promise.all([
    handlePermission(userId, 'post', 'sessions'),
    userId ? resolveAdminGenerationScope(userId) : Promise.resolve(null),
  ])
  const canCreateInCurrentScope =
    canCreate && resolvedScope?.scope?.kind === 'generation'

  return (
    // 목록이 먼저 오고, 개인 일정(참여 중/참여 가능)은 그 아래 보조 섹션으로
    // 둡니다. 이전에는 두 섹션이 페이지 제목보다 위에 있어 실제 세션 목록이
    // 화면 밖으로 밀려나 있었습니다.
    <AdminDefaultLayout className={'gap-6'}>
      <AdminPageHeader
        title={t.sessions}
        actions={
          <>
            {canCreateInCurrentScope && (
              <Link
                href={localizeAdminHref('/admin/sessions/create', locale)}
                className={'admin-btn-primary'}
              >
                <PlusCircleIcon className={'size-5'} aria-hidden={'true'} />
                {t.create}
              </Link>
            )}
            {canCreate && !canCreateInCurrentScope && (
              <p className={'admin-badge-warning py-1.5'}>
                {t.selectSpecificGenerationToCreate}
              </p>
            )}
          </>
        }
      />
      <Suspense fallback={<AdminTableSkeleton />}>
        <SessionsTable
          scope={resolvedScope?.scope ?? null}
          locale={locale}
          t={t}
        />
      </Suspense>
      <div className={'border-hairline flex flex-col gap-6 border-t pt-6'}>
        <Suspense fallback={<AdminCardSkeleton />}>
          <UpcomingSessions />
        </Suspense>
        <Suspense fallback={<AdminCardSkeleton />}>
          <RegisterSession />
        </Suspense>
      </div>
    </AdminDefaultLayout>
  )
}
