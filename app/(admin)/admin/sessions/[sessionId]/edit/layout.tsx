import { ReactNode } from 'react'
import { connection } from 'next/server'
import { requirePermission } from '@/lib/server/permission/require-permission'

export default async function EditSessionLayout({
  children,
}: {
  children: ReactNode
}) {
  await connection()
  await requirePermission('put', 'sessions')

  return <>{children}</>
}
