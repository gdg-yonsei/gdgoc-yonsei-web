import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import MembersTable from '@/app/admin/members/members-table'
import { Suspense } from 'react'

export default function MembersPage() {
  return (
    <AdminDefaultLayout className={'p-4'}>
      <div className={'admin-title'}>Members</div>
      <Suspense
        fallback={
          <div
            className={'w-full h-28 rounded-xl bg-neutral-200 animate-pulse'}
          />
        }
      >
        <MembersTable />
      </Suspense>
    </AdminDefaultLayout>
  )
}
