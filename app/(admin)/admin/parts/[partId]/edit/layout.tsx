import { ReactNode } from 'react'
import { connection } from 'next/server'
import { requirePermission } from '@/lib/server/permission/require-permission'

export default async function EditPartLayout({
  children,
}: {
  children: ReactNode
}) {
  await connection()
  await requirePermission('put', 'parts')

  return <>{children}</>
}
