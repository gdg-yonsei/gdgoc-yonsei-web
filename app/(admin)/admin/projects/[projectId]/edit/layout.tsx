/** 프로젝트가 없으면 404, 수정 권한이 없으면 403이다.
 * 작성자만 허용하는 `own` 규칙에 소유자 id를 전달하고, 요청 렌더링은 상위 레이아웃이 맡는다. */
import { notFound } from 'next/navigation'
import { getProject } from '@/lib/server/fetcher/admin/get-project'
import { requirePermission } from '@/lib/server/permission/require-permission'

export default async function EditProjectLayout({
  children,
  params,
}: LayoutProps<'/admin/projects/[projectId]/edit'>) {
  const { projectId } = await params
  const projectData = await getProject(projectId)

  if (!projectData) {
    notFound()
  }

  await requirePermission('put', 'projects', projectData.authorId)

  return children
}
