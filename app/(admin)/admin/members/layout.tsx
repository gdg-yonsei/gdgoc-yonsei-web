import { ReactNode } from 'react'
import { requirePermission } from '@/lib/server/permission/require-permission'

export default async function MembersLayout({
  children,
}: {
  children: ReactNode
}) {
  await requirePermission('get', 'membersPage')

  return <>{children}</>
}
