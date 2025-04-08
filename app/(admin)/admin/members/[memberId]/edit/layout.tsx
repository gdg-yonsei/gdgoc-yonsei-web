import { ReactNode } from 'react'
import { forbidden } from 'next/navigation'
import handlePermission from '@/lib/admin/handle-permission'
import { auth } from '@/auth'

export default async function EditMembersLayout({
  children,
}: {
  children: ReactNode
}) {
  // 사용자 members 을 수정할 권한이 있는지 확인
  const session = await auth()
  if (!(await handlePermission(session?.user?.id, 'put', 'members'))) {
    return forbidden()
  }
  return <>{children}</>
}
