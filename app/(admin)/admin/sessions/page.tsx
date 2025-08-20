import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import { auth } from '@/auth'
import handlePermission from '@/lib/server/permission/handle-permission'
import Link from 'next/link'
import { PlusCircleIcon } from '@heroicons/react/24/outline'
import SessionsTable from '@/app/(admin)/admin/sessions/sessionsTable'
import { Suspense } from 'react'
import { Metadata } from 'next'
import UpcomingSessions from '@/app/(admin)/admin/sessions/upcomingSessions'

export const metadata: Metadata = {
  title: 'Sessions',
}

export default async function SessionsPage() {
  const session = await auth()
  // 사용자가 Session 을 생성할 권한이 있는지 확인
  const canCreate = await handlePermission(
    session?.user?.id,
    'post',
    'sessions'
  )

  return (
    <AdminDefaultLayout className={'p-4'}>
      <Suspense>
        <UpcomingSessions />
      </Suspense>
      <div className={'flex items-center gap-2 pb-2'}>
        <div className={'admin-title'}>Sessions</div>
        {canCreate && (
          <Link
            href={'/admin/sessions/create'}
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
        <SessionsTable />
      </Suspense>
    </AdminDefaultLayout>
  )
}
