import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import { getProject } from '@/lib/fetcher/get-project'
import { notFound } from 'next/navigation'

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  // Project 데이터 가져오기
  const projectData = await getProject(projectId)
  // Project 데이터가 없으면 404 페이지 표시
  if (!projectData) {
    notFound()
  }

  return (
    <AdminDefaultLayout>
      <div></div>
    </AdminDefaultLayout>
  )
}
