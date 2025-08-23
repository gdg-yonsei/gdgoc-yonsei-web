import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import MembersTable from '@/app/(admin)/admin/members/members-table'
import { Suspense } from 'react'
import Link from 'next/link'
import { UsersIcon } from '@heroicons/react/24/outline'
import { auth } from '@/auth'
import handlePermission from '@/lib/server/permission/handle-permission'

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Members',
}

export default async function MembersPage() {
  const session = await auth()
  const canAccept = await handlePermission(
    session?.user?.id,
    'put',
    'membersRole'
  )

  return (
    <AdminDefaultLayout className={'p-4'}>
      <div className={'flex items-center gap-2 pb-2'}>
        <div className={'admin-title'}>Members</div>
        {canAccept && (
          <Link
            href={'/admin/members/accept'}
            className={
              'flex items-center gap-1 rounded-xl bg-neutral-900 p-2 px-3 text-sm text-white transition-all hover:bg-neutral-800'
            }
          >
            <UsersIcon className={'size-5'} />
            <p>Approve Member</p>
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
        <MembersTable />
      </Suspense>
    </AdminDefaultLayout>
  )
}
