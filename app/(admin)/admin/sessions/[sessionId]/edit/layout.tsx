import { ReactNode } from 'react'
import { auth } from '@/auth'
import handlePermission from '@/lib/server/permission/handle-permission'
import { forbidden } from 'next/navigation'

export default async function EditSessionLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await auth()
  // 사용자가 session을 수정할 권한이 있는지 확인
  if (!(await handlePermission(session?.user?.id, 'put', 'sessions'))) {
    forbidden()
  }

  return <>{children}</>
}
