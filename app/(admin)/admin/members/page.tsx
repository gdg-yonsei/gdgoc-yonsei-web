import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminPageHeader from '@/app/components/admin/page-header'
import { AdminTableSkeleton } from '@/app/components/admin/skeleton'
import MembersTable from '@/app/(admin)/admin/members/members-table'
import { Suspense } from 'react'
import Link from 'next/link'
import { UsersIcon } from '@heroicons/react/24/outline'
import { auth } from '@/auth'
import handlePermission from '@/lib/server/permission/handle-permission'

import { Metadata } from 'next'
import {
  getAdminLocale,
  getAdminMessages,
  localizeAdminHref,
} from '@/lib/admin-i18n/server'
import { resolveAdminGenerationScope } from '@/lib/server/admin-generation-scope'

export const metadata: Metadata = {
  title: 'Members',
}

export default async function MembersPage() {
  const [locale, session] = await Promise.all([getAdminLocale(), auth()])
  const t = getAdminMessages(locale)
  const userId = session?.user?.id
  const [canAccept, resolvedScope] = await Promise.all([
    handlePermission(userId, 'put', 'membersRole'),
    userId ? resolveAdminGenerationScope(userId) : Promise.resolve(null),
  ])

  return (
    <AdminDefaultLayout>
      <AdminPageHeader
        title={t.members}
        actions={
          canAccept && (
            <Link
              href={localizeAdminHref('/admin/members/accept', locale)}
              className={'admin-btn-primary'}
            >
              <UsersIcon className={'size-5'} aria-hidden={'true'} />
              {t.approveMember}
            </Link>
          )
        }
      />
      <Suspense fallback={<AdminTableSkeleton />}>
        <MembersTable
          scope={resolvedScope?.scope ?? null}
          locale={locale}
          t={t}
        />
      </Suspense>
    </AdminDefaultLayout>
  )
}
