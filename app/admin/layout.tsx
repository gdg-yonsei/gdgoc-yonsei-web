import { ReactNode } from 'react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import Header from '@/app/components/admin/header'
import JotaiProvider from '@/app/components/jotai-provider'
import Sidebar from '@/app/components/admin/sidebar'
import AuthProvider from '@/app/components/auth/auth-provider'

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
  if (!session?.user?.id) {
    return redirect('/auth/sign-in')
  }

  return (
    <AuthProvider>
      <Header />
      <JotaiProvider>
        <Sidebar />
        {children}
      </JotaiProvider>
    </AuthProvider>
  )
}
