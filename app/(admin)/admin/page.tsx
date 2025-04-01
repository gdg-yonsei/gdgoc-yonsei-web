import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import QRCodeGenerator from '@/app/components/admin/qr-code-generator'

/**
 * 관리자 홈페이지
 * @constructor
 */
export default function AdminPage() {
  return (
    <AdminDefaultLayout className={'w-full flex flex-col p-4 gap-4'}>
      <div className={'admin-title'}>Home</div>
      <div className={'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}>
        <QRCodeGenerator />
      </div>
    </AdminDefaultLayout>
  )
}
