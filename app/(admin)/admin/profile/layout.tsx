import { ReactNode } from 'react'
import { requirePermission } from '@/lib/server/permission/require-permission'

export default async function ProfileLayout({
  children,
}: {
  children: ReactNode
}) {
  await requirePermission('get', 'profilePage')

  return <>{children}</>
}
