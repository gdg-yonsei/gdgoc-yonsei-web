import { ReactNode } from 'react'
import { connection } from 'next/server'
import { requirePermission } from '@/lib/server/permission/require-permission'

export default async function EditMembersLayout({
  children,
}: {
  children: ReactNode
}) {
  await connection()
  await requirePermission('put', 'members')

  return <>{children}</>
}
