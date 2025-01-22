import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import { getProject } from '@/lib/fetcher/get-project'
import { notFound } from 'next/navigation'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { updateProjectAction } from '@/app/admin/projects/[projectId]/edit/actions'
import DataForm from '@/app/components/data-form'
import DataInput from '@/app/components/admin/data-input'
import SubmitButton from '@/app/components/admin/submit-button'
import DataTextarea from '@/app/components/admin/data-textarea'

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

  const updateProjectActionWithProjectId = updateProjectAction.bind(
    null,
    projectId
  )

  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={`/admin/projects/${projectId}`}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>{projectData.name} Project</p>
      </AdminNavigationButton>
      <div className={'admin-title py-4'}>Edit {projectData.name} Project</div>
      <DataForm
        action={updateProjectActionWithProjectId}
        className={'w-full gap-4 member-data-grid'}
      >
        <DataInput
          defaultValue={projectData.name}
          name={'name'}
          placeholder={'Project Name'}
          title={'Project Name'}
        />
        <DataInput
          defaultValue={projectData.description}
          name={'description'}
          placeholder={'Project Description'}
          title={'Project Description'}
        />
        <DataTextarea
          defaultValue={projectData.content}
          name={'content'}
          placeholder={'Content'}
        />
        <SubmitButton />
      </DataForm>
    </AdminDefaultLayout>
  )
}
