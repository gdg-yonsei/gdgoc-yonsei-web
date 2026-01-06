import { ReactNode } from 'react'
import { auth } from '@/auth'
import handlePermission from '@/lib/server/permission/handle-permission'
import { forbidden } from 'next/navigation'
import { getProject } from '@/lib/server/fetcher/admin/get-project'

export default async function EditProjectLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ projectId: string }>
}) {
  const session = await auth()
  const { projectId } = await params
  const projectData = await getProject(projectId)

  // 사용자가 project를 수정할 권한이 있는지 확인
  if (
    !(await handlePermission(
      session?.user?.id,
      'put',
      'projects',
      projectData.authorId
    ))
  ) {
    forbidden()
  }

  return <>{children}</>
}
