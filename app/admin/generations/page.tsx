import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import GenerationsTable from '@/app/admin/generations/generations-table'
import { Suspense } from 'react'

export default function GenerationsPage() {
  return (
    <AdminDefaultLayout>
      <div className={'admin-title'}>Generations</div>
      <Suspense fallback={<div>Loading...</div>}>
        <GenerationsTable />
      </Suspense>
    </AdminDefaultLayout>
  )
}
