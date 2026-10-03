/**
 * 프로젝트 수정 화면의 권한 경계(서버 레이아웃). 프로젝트가 없으면 404, `projects` `put` 권한이
 * 없으면 403. 역할에 따라 작성자 본인만 허용하는 `'own'` 규칙이 있어 작성자 id를 함께 넘긴다.
 * 요청 시점 렌더링은 상위 `[projectId]/layout.tsx`가 고정한다. 권한 표는 `lib/server/permission/policy.ts`에 있다.
 */
import { notFound } from 'next/navigation'
import { getProject } from '@/lib/server/fetcher/admin/get-project'
import { requirePermission } from '@/lib/server/permission/require-permission'

/** 권한을 확인한 뒤 하위 페이지를 그대로 렌더링한다. */
export default async function EditProjectLayout({
  children,
  params,
}: LayoutProps<'/admin/projects/[projectId]/edit'>) {
  const { projectId } = await params
  const projectData = await getProject(projectId)

  if (!projectData) {
    notFound()
  }

  // 작성자 본인인지까지 확인해야 하므로 소유자 id를 넘긴다.
  await requirePermission('put', 'projects', projectData.authorId)

  return children
}
