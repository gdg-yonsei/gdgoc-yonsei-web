import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'

/**
 * 관리자 홈페이지
 * @constructor
 */
export default function AdminPage() {
  return (
    <AdminDefaultLayout className={'w-full flex flex-col p-4 gap-4'}>
      <div className={'admin-title'}>Home</div>
    </AdminDefaultLayout>
  )
}
