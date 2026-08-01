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

/**
 * `MembersPage` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(없음)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
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
