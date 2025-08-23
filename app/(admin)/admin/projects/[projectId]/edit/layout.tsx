import { ReactNode } from 'react'
import { auth } from '@/auth'
import handlePermission from '@/lib/server/permission/handle-permission'
import { forbidden } from 'next/navigation'

export default async function EditProjectLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await auth()
  // 사용자가 project를 수정할 권한이 있는지 확인
  if (!(await handlePermission(session?.user?.id, 'put', 'projects'))) {
    forbidden()
  }

  return <>{children}</>
}
