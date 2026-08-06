import { ReactNode } from 'react'
import { requirePermission } from '@/lib/server/permission/require-permission'

export default async function GenerationsLayout({
  children,
}: {
  children: ReactNode
}) {
  await requirePermission('get', 'generationsPage')

  return <>{children}</>
}
