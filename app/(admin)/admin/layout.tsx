import { ReactNode } from 'react'
import { auth } from '@/auth'
import { Metadata } from 'next'
import Header from '@/app/components/admin/header'
import JotaiProvider from '@/app/components/jotai-provider'
import Sidebar from '@/app/components/admin/sidebar'
import AuthProvider from '@/app/components/auth/auth-provider'
import getUserRole from '@/lib/fetcher/admin/get-user-role'
import navigationList from '@/app/(admin)/admin/navigation-list'
import { forbidden, redirect } from 'next/navigation'
import Modal from '@/app/components/admin/modal'

export const metadata: Metadata = {
  title: 'GYMS',
  description:
    'Google Developer Group on Campus Yonsei University Management System',
}

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  /** 사용자가 로그인 되어 있는지 확인 */
  const session = await auth()
  if (!session) {
    redirect('/auth/sign-in')
  }
  // 인증되지 않은 사용자의 경우 접근 금지
  if ((await getUserRole(session?.user?.id)) === 'UNVERIFIED') {
    forbidden()
  }

  // 사용자의 권한에 따라 네비게이션 목록을 가져옴
  const navigations = await navigationList(session?.user?.id)

  return (
    <AuthProvider>
      <Header navigations={navigations} />
      <JotaiProvider>
        <Sidebar navigations={navigations} />
        {children}
        <Modal />
      </JotaiProvider>
    </AuthProvider>
  )
}
