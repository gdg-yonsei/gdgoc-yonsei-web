import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import { getProject } from '@/lib/fetcher/get-project'
import { notFound } from 'next/navigation'

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const projectData = await getProject(projectId)
  if (!projectData) {
    notFound()
  }

  return (
    <AdminDefaultLayout>
      <div className={'admin-title'}>Edit Project</div>
    </AdminDefaultLayout>
  )
}
