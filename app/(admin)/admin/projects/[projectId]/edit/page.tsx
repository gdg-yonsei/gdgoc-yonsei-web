import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import { getProject } from '@/lib/server/fetcher/admin/get-project'
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
import DataSelectInput from '@/app/components/admin/data-select-input'
import { getGenerations } from '@/lib/server/fetcher/admin/get-generations'
import { getMembersWithGeneration } from '@/lib/server/fetcher/admin/get-members-with-generation'
import MembersSelectInput from '@/app/components/admin/member-select-input'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Project',
}

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

  const membersList = await getMembersWithGeneration()

  // 기수 정보 가져오기
  const generations = await getGenerations()
  // 기수 선택용 리스트
  const generationList = generations.map((generation) => ({
    name: generation.name,
    value: String(generation.id),
  }))

  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={`/admin/projects/${projectId}`}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>{projectData.name} Project</p>
      </AdminNavigationButton>
      <div className={'admin-title py-4'}>Edit {projectData.name} Project</div>
      <DataForm
        action={updateProjectActionWithProjectId}
        className={'member-data-grid w-full gap-4'}
      >
        <DataInput
          defaultValue={projectData.name}
          name={'name'}
          placeholder={'Project Name (English)'}
          title={'Project Name (English)'}
        />
        <DataInput
          defaultValue={projectData.nameKo}
          name={'nameKo'}
          placeholder={'Project Name (Korean)'}
          title={'Project Name (Korean)'}
        />
        <DataInput
          defaultValue={projectData.description}
          name={'description'}
          placeholder={'Project Description (English)'}
          title={'Project Description (English)'}
        />
        <DataInput
          defaultValue={projectData.descriptionKo}
          name={'descriptionKo'}
          placeholder={'Project Description (Korean)'}
          title={'Project Description (Korean)'}
        />
        <DataSelectInput
          title={'Generation'}
          data={generationList}
          name={'generationId'}
          defaultValue={String(projectData.generationId)}
        />
        <MembersSelectInput
          membersList={membersList}
          defaultValue={projectData.usersToProjects.map((user) => user.userId)}
        />
        <div
          className={
            'member-data-col-span col-span-1 grid grid-cols-1 gap-2 sm:col-span-3 sm:grid-cols-2 md:col-span-4'
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
          title={'Content (English)'}
          name={'content'}
          defaultValue={projectData.content}
          placeholder={'Please write content'}
        />
        <MDXEditor
          title={'Content (Korean)'}
          name={'contentKo'}
          defaultValue={projectData.contentKo}
          placeholder={'Please write content (Korean)'}
        />
        <SubmitButton />
      </DataForm>
    </AdminDefaultLayout>
  )
}
