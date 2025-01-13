import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import GenerationsTable from '@/app/admin/generations/generations-table'
import { Suspense } from 'react'
import handlePermission from '@/lib/admin/handle-permission'
import { auth } from '@/auth'
import Link from 'next/link'
import { PlusCircleIcon } from '@heroicons/react/24/outline'

export default async function GenerationsPage() {
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
              'flex items-center gap-1 p-2 px-3 rounded-xl bg-neutral-900 text-white text-sm hover:bg-neutral-800 transition-all'
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
            className={'w-full h-28 rounded-xl bg-neutral-200 animate-pulse'}
          />
        }
      >
        <GenerationsTable />
      </Suspense>
    </AdminDefaultLayout>
  )
}
