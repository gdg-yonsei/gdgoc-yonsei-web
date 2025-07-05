import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import GenerationsTable from '@/app/(admin)/admin/generations/generations-table'
import { Suspense } from 'react'
import handlePermission from '@/lib/admin/handle-permission'
import { auth } from '@/auth'
import Link from 'next/link'
import { PlusCircleIcon } from '@heroicons/react/24/outline'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Generations',
}

export default async function GenerationsPage() {
  // 사용자가 generation 생성 권한이 있는지 확인
  const session = await auth()
  const canCreate = await handlePermission(
    session?.user?.id,
    'post',
    'generations'
  )

  return (
    <AdminDefaultLayout>
      <div className={'flex items-center gap-2 pb-2'}>
        <div className={'admin-title'}>Generations</div>
        {canCreate && (
          <Link
            href={'/admin/generations/create'}
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
        <GenerationsTable />
      </Suspense>
    </AdminDefaultLayout>
  )
}
