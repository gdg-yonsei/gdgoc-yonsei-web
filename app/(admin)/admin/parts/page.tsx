import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import { Suspense } from 'react'
import PartsTable from '@/app/(admin)/admin/parts/parts-table'
import handlePermission from '@/lib/server/permission/handle-permission'
import Link from 'next/link'
import { auth } from '@/auth'
import { PlusCircleIcon } from '@heroicons/react/24/outline'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Parts',
}

export default async function PartsPage() {
  const session = await auth()
  // 사용자가 파타를 생성할 권한이 있는지 확인
  const canCreate = await handlePermission(session?.user?.id, 'post', 'parts')

  return (
    <AdminDefaultLayout>
      <div className={'flex items-center gap-2 pb-2'}>
        <div className={'admin-title'}>Parts</div>
        {canCreate && (
          <Link
            href={'/admin/parts/create'}
            className={
              'flex items-center gap-1 rounded-xl bg-neutral-900 p-2 px-3 text-sm text-white transition-all hover:bg-neutral-800'
            }
          >
            <PlusCircleIcon className={'size-5'} />
            <p>Create</p>
          </Link>
        )}
      </div>

      <Suspense
        fallback={
          <div
            className={'h-28 w-full animate-pulse rounded-xl bg-neutral-200'}
          />
        }
      >
        <PartsTable />
      </Suspense>
    </AdminDefaultLayout>
  )
}
