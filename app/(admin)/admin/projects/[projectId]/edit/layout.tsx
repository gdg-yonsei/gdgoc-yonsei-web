import { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { getProject } from '@/lib/server/fetcher/admin/get-project'
import { requirePermission } from '@/lib/server/permission/require-permission'

export default async function EditProjectLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ projectId: string }>
}) {
  await connection()
  const { projectId } = await params
  const projectData = await getProject(projectId)

  if (!projectData) {
    notFound()
  }

  // 프로젝트 작성자 본인인지까지 확인해야 하므로 소유자 id 를 넘긴다.
  await requirePermission('put', 'projects', projectData.authorId)

  return <>{children}</>
}
