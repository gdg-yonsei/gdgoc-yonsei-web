import { ReactNode } from 'react'
import { requirePermission } from '@/lib/server/permission/require-permission'

export default async function CreateProjectLayout({
  children,
}: {
  children: ReactNode
}) {
  await requirePermission('post', 'projects')

  return <>{children}</>
}
