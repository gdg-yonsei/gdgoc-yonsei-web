import { ReactNode } from 'react'
import { requirePermission } from '@/lib/server/permission/require-permission'

export default async function CreateSessionLayout({
  children,
}: {
  children: ReactNode
}) {
  await requirePermission('post', 'sessions')

  return <>{children}</>
}
