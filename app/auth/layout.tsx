import { ReactNode } from 'react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function AuthLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await auth()
  // 만약 로그인 되어 있다면 어드민 페이지로 이동
  if (session) {
    return redirect('/admin')
  }

  return <>{children}</>
}
