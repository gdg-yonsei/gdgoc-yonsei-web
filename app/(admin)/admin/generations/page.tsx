import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminPageHeader from '@/app/components/admin/page-header'
import { AdminTableSkeleton } from '@/app/components/admin/skeleton'
import GenerationsTable from '@/app/(admin)/admin/generations/generations-table'
import { Suspense } from 'react'
import handlePermission from '@/lib/server/permission/handle-permission'
import { getAuthSession } from '@/auth'
import Link from 'next/link'
import { PlusCircleIcon } from '@heroicons/react/24/outline'
import { Metadata } from 'next'
import {
  getAdminLocale,
  getAdminMessages,
  localizeAdminHref,
} from '@/lib/admin-i18n/server'

export const metadata: Metadata = {
  title: 'Generations',
}

export default async function GenerationsPage() {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  // 사용자가 generation 생성 권한이 있는지 확인
  const session = await getAuthSession()
  const canCreate = await handlePermission(
    session?.user?.id,
    'post',
    'generations'
  )

  return (
    <AdminDefaultLayout>
      <AdminPageHeader
        title={t.generations}
        actions={
          canCreate && (
            <Link
              href={localizeAdminHref('/admin/generations/create', locale)}
              className={'admin-btn-primary'}
            >
              <PlusCircleIcon className={'size-5'} aria-hidden={'true'} />
              {t.create}
            </Link>
          )
        }
      />
      <Suspense fallback={<AdminTableSkeleton />}>
        <GenerationsTable />
      </Suspense>
    </AdminDefaultLayout>
  )
}
