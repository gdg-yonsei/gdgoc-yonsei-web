import { ReactNode } from 'react'
import { auth } from '@/auth'
import handlePermission from '@/lib/admin/handle-permission'
import { forbidden } from 'next/navigation'

export default async function EditGenerationLayout({
  children,
}: {
  children: ReactNode
}) {
  // 사용자가 generations 를 수정할 권한이 있는지 확인
  const session = await auth()
  if (!(await handlePermission(session?.user?.id, 'put', 'generations'))) {
    forbidden()
  }

  return <>{children}</>
}
