import { ReactNode } from 'react'
import { requirePermission } from '@/lib/server/permission/require-permission'

export default async function PartsLayout({
  children,
}: {
  children: ReactNode
}) {
  await requirePermission('get', 'partsPage')

  return <>{children}</>
}
