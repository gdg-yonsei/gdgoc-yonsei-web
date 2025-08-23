import { ReactNode } from 'react'
import { forbidden } from 'next/navigation'
import handlePermission from '@/lib/server/permission/handle-permission'
import { auth } from '@/auth'

export default async function EditProfileLayout({
  children,
}: {
  children: ReactNode
}) {
  // 사용자 generation 을 추가할 권한이 있는지 확인
  const session = await auth()
  if (
    !(await handlePermission(
      session?.user?.id,
      'put',
      'members',
      session?.user?.id
    ))
  ) {
    return forbidden()
  }
  return <>{children}</>
}
