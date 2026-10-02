/**
 * 기수 목록 화면(`/admin/generations`). 생성 권한이 있으면 "만들기" 버튼을 보인다.
 */
import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminPageHeader from '@/app/components/admin/page-header'
import { AdminTableSkeleton } from '@/app/components/admin/skeleton'
import GenerationsTable from '@/app/(admin)/admin/generations/generations-table'
import { Suspense } from 'react'
import { hasPermission } from '@/lib/server/permission/has-permission'
import { getAuthSession } from '@/auth'
import Link from 'next/link'
import { PlusCircleIcon } from '@heroicons/react/24/outline'
import { Metadata } from 'next'
import {
  getAdminLocale,
  getAdminMessages,
  localizeAdminHref,
} from '@/lib/admin-i18n/server'

/** 브라우저 탭 제목. */
export const metadata: Metadata = {
  title: 'Generations',
}

/** 기수 목록. 표는 Suspense로 스트리밍하고 그동안 스켈레톤을 보여 준다. */
export default async function GenerationsPage() {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  const session = await getAuthSession()
  const canCreate = await hasPermission(
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
