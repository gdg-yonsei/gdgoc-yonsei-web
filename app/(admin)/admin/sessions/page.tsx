import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import {
  AdminCardSkeleton,
  AdminTableSkeleton,
} from '@/app/components/admin/skeleton'
import AdminPageHeader from '@/app/components/admin/page-header'
import { getAuthSession } from '@/auth'
import { hasPermission } from '@/lib/server/permission/has-permission'
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
  const [locale, session] = await Promise.all([
    getAdminLocale(),
    getAuthSession(),
  ])
  const t = getAdminMessages(locale)
  const userId = session?.user?.id
  const [canCreate, resolvedScope] = await Promise.all([
    hasPermission(userId, 'post', 'sessions'),
    userId ? resolveAdminGenerationScope(userId) : Promise.resolve(null),
  ])
  const canCreateInCurrentScope =
    canCreate && resolvedScope?.scope?.kind === 'generation'

  return (
    // 세션은 특정 기수에 속해야 하므로 "전체 기수" 범위에서는 만들기 버튼 대신 안내를 보인다.
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
        <SessionsTable scope={resolvedScope?.scope ?? null} />
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
