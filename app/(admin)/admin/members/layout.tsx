import { ReactNode } from 'react'
import { auth } from '@/auth'
import handlePermission from '@/lib/server/permission/handle-permission'
import { forbidden } from 'next/navigation'

export default async function MembersLayout({
  children,
}: {
  children: ReactNode
}) {
  // 사용자가 membersPage 를 볼 권한이 있는지 확인
  const session = await auth()
  if (!(await handlePermission(session?.user?.id, 'get', 'membersPage'))) {
    forbidden()
  }

  return <>{children}</>
}
