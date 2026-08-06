import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminPageHeader from '@/app/components/admin/page-header'
import { AdminTableSkeleton } from '@/app/components/admin/skeleton'
import { Suspense } from 'react'
import PartsTable from '@/app/(admin)/admin/parts/parts-table'
import handlePermission from '@/lib/server/permission/handle-permission'
import Link from 'next/link'
import { auth } from '@/auth'
import { PlusCircleIcon } from '@heroicons/react/24/outline'
import { Metadata } from 'next'
import {
  getAdminLocale,
  getAdminMessages,
  localizeAdminHref,
} from '@/lib/admin-i18n/server'
import { resolveAdminGenerationScope } from '@/lib/server/admin-generation-scope'

export const metadata: Metadata = {
  title: 'Parts',
}

export default async function PartsPage() {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  const session = await auth()
  // 사용자가 파타를 생성할 권한이 있는지 확인
  const canCreate = await handlePermission(session?.user?.id, 'post', 'parts')
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
