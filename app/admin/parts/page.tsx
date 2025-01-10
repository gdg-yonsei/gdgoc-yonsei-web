import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import { Suspense } from 'react'
import PartsTable from '@/app/admin/parts/parts-table'

export default function PartsPage() {
  return (
    <AdminDefaultLayout>
      <div className={'admin-title'}>Parts</div>
      <Suspense
        fallback={
          <div
            className={'w-full h-28 rounded-xl bg-neutral-200 animate-pulse'}
          />
        }
      >
        <PartsTable />
      </Suspense>
    </AdminDefaultLayout>
  )
}
