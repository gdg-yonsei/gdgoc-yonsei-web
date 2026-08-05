import { ReactNode } from 'react'
import { requirePermission } from '@/lib/server/permission/require-permission'

export default async function AcceptMembersLayout({
  children,
}: {
  children: ReactNode
}) {
  await requirePermission('put', 'membersRole')

  return <>{children}</>
}
