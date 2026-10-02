/**
 * 멤버 목록 화면(`/admin/members`).
 */
import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminPageHeader from '@/app/components/admin/page-header'
import { AdminTableSkeleton } from '@/app/components/admin/skeleton'
import MembersTable from '@/app/(admin)/admin/members/members-table'
import { Suspense } from 'react'
import Link from 'next/link'
import { UsersIcon } from '@heroicons/react/24/outline'
import { getAuthSession } from '@/auth'
import { hasPermission } from '@/lib/server/permission/has-permission'

import { Metadata } from 'next'
import {
  getAdminLocale,
  getAdminMessages,
  localizeAdminHref,
} from '@/lib/admin-i18n/server'
import { resolveAdminGenerationScope } from '@/lib/server/admin-generation-scope'

/** 브라우저 탭 제목. */
export const metadata: Metadata = {
  title: 'Members',
}

/** 멤버 목록. 승인 권한이 있으면 "가입 승인" 버튼을 보이고, 표는 Suspense로 스트리밍한다. */
export default async function MembersPage() {
  const [locale, session] = await Promise.all([
    getAdminLocale(),
    getAuthSession(),
  ])
  const t = getAdminMessages(locale)
  const userId = session?.user?.id
  const [canAccept, resolvedScope] = await Promise.all([
    hasPermission(userId, 'put', 'membersRole'),
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
        <MembersTable scope={resolvedScope?.scope ?? null} />
      </Suspense>
    </AdminDefaultLayout>
  )
}
