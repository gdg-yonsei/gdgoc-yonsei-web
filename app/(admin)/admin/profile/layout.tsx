import { ReactNode } from 'react'
import { auth } from '@/auth'
import handlePermission from '@/lib/server/permission/handle-permission'
import { forbidden } from 'next/navigation'

export default async function ProfileLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await auth()
  // 프로필 페이지를 볼 권한이 있는지 확인
  if (!(await handlePermission(session?.user?.id, 'get', 'profilePage'))) {
    forbidden()
  }

  return <>{children}</>
}
