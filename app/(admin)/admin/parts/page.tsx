/**
 * 파트 목록 화면(`/admin/parts`). 생성 권한이 있으면 "만들기" 버튼을 보인다.
 */
import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminPageHeader from '@/app/components/admin/page-header'
import { AdminTableSkeleton } from '@/app/components/admin/skeleton'
import { Suspense } from 'react'
import PartsTable from '@/app/(admin)/admin/parts/parts-table'
import { hasPermission } from '@/lib/server/permission/has-permission'
import Link from 'next/link'
import { getAuthSession } from '@/auth'
import { PlusCircleIcon } from '@heroicons/react/24/outline'
import { Metadata } from 'next'
import {
  getAdminLocale,
  getAdminMessages,
  localizeAdminHref,
} from '@/lib/admin-i18n/server'
import { resolveAdminGenerationScope } from '@/lib/server/admin-generation-scope'

/** 브라우저 탭 제목. */
export const metadata: Metadata = {
  title: 'Parts',
}

/** 파트 목록. 표는 Suspense로 스트리밍하고 그동안 스켈레톤을 보여 준다. */
export default async function PartsPage() {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  const session = await getAuthSession()
  const canCreate = await hasPermission(session?.user?.id, 'post', 'parts')
  const resolvedScope = session?.user?.id
    ? await resolveAdminGenerationScope(session.user.id)
    : null
  const canCreateInCurrentScope =
    canCreate && resolvedScope?.scope?.kind === 'generation'

  return (
    <AdminDefaultLayout>
      <AdminPageHeader
        title={t.parts}
        actions={
          <>
            {canCreateInCurrentScope && (
              <Link
                href={localizeAdminHref('/admin/parts/create', locale)}
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
        <PartsTable scope={resolvedScope?.scope ?? null} />
      </Suspense>
    </AdminDefaultLayout>
  )
}
