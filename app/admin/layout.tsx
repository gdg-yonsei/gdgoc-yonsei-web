import { ReactNode } from 'react'
import { auth } from '@/auth'
import { Metadata } from 'next'
import Header from '@/app/components/admin/header'
import JotaiProvider from '@/app/components/jotai-provider'
import Sidebar from '@/app/components/admin/sidebar'
import AuthProvider from '@/app/components/auth/auth-provider'
import getUserRole from '@/lib/admin/get-user-role'
import navigationList from '@/app/admin/navigation-list'
import { forbidden, redirect } from 'next/navigation'

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
  if ((await getUserRole(session?.user?.id)) === 'unverified') {
    forbidden()
  }

  const navigations = await navigationList(session?.user?.id)

  return (
    <AuthProvider>
      <Header navigations={navigations} />
      <JotaiProvider>
        <Sidebar navigations={navigations} />
        {children}
      </JotaiProvider>
    </AuthProvider>
  )
}
