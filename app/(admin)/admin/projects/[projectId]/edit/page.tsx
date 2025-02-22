import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import { getProject } from '@/lib/fetcher/get-project'
import { notFound } from 'next/navigation'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { updateProjectAction } from '@/app/(admin)/admin/projects/[projectId]/edit/actions'
import DataForm from '@/app/components/data-form'
import DataInput from '@/app/components/admin/data-input'
import SubmitButton from '@/app/components/admin/submit-button'
import MDXEditor from '@/app/components/admin/mdx-editor'
import DataImageInput from '@/app/components/admin/data-image-input'
import DataMultipleImageInput from '@/app/components/admin/data-multiple-image-input'
import formatUserName from '@/lib/format-user-name'
import DataSelectMultipleInput from '@/app/components/admin/data-select-multiple-input'
import { getMembers } from '@/lib/fetcher/get-members'

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

  const membersList = await getMembers()

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
        <DataSelectMultipleInput
          data={membersList.map((member) => ({
            value: member.id,
            name: `${member.generation} ${formatUserName(member.name, member.firstName, member.lastName, member.isForeigner)}`,
          }))}
          name={'participants'}
          title={'Participants'}
          defaultValue={projectData.usersToProjects.map((user) => user.userId)}
        />
        <div
          className={
            'col-span-1 sm:col-span-3 md:col-span-4 member-data-col-span grid grid-cols-1 sm:grid-cols-2 gap-2'
          }
        >
          <div>
            <DataImageInput
              baseUrl={'/admin/projects/main-image'}
              title={'Main Image'}
              name={'mainImage'}
              defaultValue={projectData.mainImage}
            >
              Select Main Image
            </DataImageInput>
          </div>
          <div>
            <DataMultipleImageInput
              baseUrl={'/api/admin/projects/content-image'}
              name={'contentImages'}
              title={'Images'}
              defaultValue={projectData.images.map((image) => image)}
            >
              Select Images
            </DataMultipleImageInput>
          </div>
        </div>
        <MDXEditor
          title={'Content'}
          name={'content'}
          defaultValue={projectData.content}
          placeholder={'Please write content'}
        />
        <SubmitButton />
      </DataForm>
    </AdminDefaultLayout>
  )
}
