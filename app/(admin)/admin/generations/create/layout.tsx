import { ReactNode } from 'react'
import { requirePermission } from '@/lib/server/permission/require-permission'

export default async function CreateGenerationLayout({
  children,
}: {
  children: ReactNode
}) {
  await requirePermission('post', 'generations')

  return <>{children}</>
}
