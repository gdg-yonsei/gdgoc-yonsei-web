import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import QRCodeGenerator from '@/app/components/admin/qr-code-generator'
import Link from 'next/link'

/**
 * 관리자 홈페이지
 * @constructor
 */
export default function AdminPage() {
  return (
    <AdminDefaultLayout className={'w-full flex flex-col p-4 gap-4'}>
      <div className={'admin-title'}>Home</div>
      <div className={'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}>
        <QRCodeGenerator />
        <Link
          href={'/admin/permissions'}
          className={
            'w-full p-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 transition-colors place-self-start text-white flex items-center justify-center text-xl font-semibold text-center'
          }
        >
          Information Accessible
          <br /> by Permission Level
        </Link>
      </div>
    </AdminDefaultLayout>
  )
}
