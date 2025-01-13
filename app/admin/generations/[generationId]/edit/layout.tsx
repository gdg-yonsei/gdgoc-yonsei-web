import { ReactNode } from 'react'
import { auth } from '@/auth'
import handlePermission from '@/lib/admin/handle-permission'
import { forbidden } from 'next/navigation'

export default async function EditGenerationLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await auth()
  // 사용자가 generation 을 수정할 권한이 있는지 확인
  if (!(await handlePermission(session?.user?.id, 'put', 'generations'))) {
    forbidden()
  }

  return <>{children}</>
}
