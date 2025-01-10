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
  if (!(await handlePermission(session?.user?.id, 'put', 'generations'))) {
    forbidden()
  }

  return <>{children}</>
}
