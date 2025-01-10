import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import GenerationsTable from '@/app/admin/generations/generations-table'
import { Suspense } from 'react'

export default function GenerationsPage() {
  return (
    <AdminDefaultLayout>
      <div className={'admin-title'}>Generations</div>
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
