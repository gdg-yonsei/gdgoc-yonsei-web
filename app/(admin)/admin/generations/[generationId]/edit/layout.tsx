import { ReactNode } from 'react'
import { connection } from 'next/server'
import { requirePermission } from '@/lib/server/permission/require-permission'

export default async function EditGenerationLayout({
  children,
}: {
  children: ReactNode
}) {
  await connection()
  await requirePermission('put', 'generations')

  return <>{children}</>
}
