import { ReactNode } from 'react'
import { requirePermission } from '@/lib/server/permission/require-permission'

export default async function SessionsLayout({
  children,
}: {
  children: ReactNode
}) {
  await requirePermission('get', 'sessionsPage')

  return <>{children}</>
}
