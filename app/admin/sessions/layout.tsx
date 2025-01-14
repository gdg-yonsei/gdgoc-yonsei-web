import { ReactNode } from 'react'
import { auth } from '@/auth'
import handlePermission from '@/lib/admin/handle-permission'
import { forbidden } from 'next/navigation'

export default async function SessionsLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await auth()
  // 사용자가 partsPage 를 볼 권한이 있는지 확인
  if (!(await handlePermission(session?.user?.id, 'get', 'sessionsPage'))) {
    forbidden()
  }

  return <>{children}</>
}
