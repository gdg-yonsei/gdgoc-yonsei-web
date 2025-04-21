import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import QRCodeGenerator from '@/app/components/admin/qr-code-generator'
import Link from 'next/link'
import { eq } from 'drizzle-orm'
import { users } from '@/db/schema/users'
import db from '@/db'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

/**
 * 관리자 홈페이지
 * @constructor
 */
export default async function AdminPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/auth/sign-in')
  }

  // 사용자의 이름 정보가 업데이트 되어 있는지 확인
  const userInfo = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: {
      firstName: true,
      lastName: true,
    },
  })
  // 만약 사용자 이름 정보가 없다면 프로필 수정 페이지로 리다이렉트
  if (!userInfo?.firstName || !userInfo?.lastName) {
    redirect('/admin/profile/edit')
  }

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
