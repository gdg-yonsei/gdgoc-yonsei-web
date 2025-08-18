import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import DataForm from '@/app/components/data-form'
import DataInput from '@/app/components/admin/data-input'
import SubmitButton from '@/app/components/admin/submit-button'
import { createProjectAction } from '@/app/(admin)/admin/projects/create/actions'
import DataImageInput from '@/app/components/admin/data-image-input'
import DataMultipleImageInput from '@/app/components/admin/data-multiple-image-input'
import DataTextarea from '@/app/components/admin/data-textarea'
import MDXEditor from '@/app/components/admin/mdx-editor'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { getGenerations } from '@/lib/server/fetcher/admin/get-generations'
import DataSelectInput from '@/app/components/admin/data-select-input'
import MembersSelectInput from '@/app/components/admin/member-select-input'
import { getMembersWithGeneration } from '@/lib/server/fetcher/admin/get-members-with-generation'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Project',
}

export default async function CreateProjectPage() {
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
      <AdminNavigationButton href={'/admin/projects'}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>Projects</p>
      </AdminNavigationButton>
      <div className={'admin-title'}>Create New Project</div>
      <DataForm
        action={createProjectAction}
        className={'member-data-grid gap-2'}
      >
        <div
          className={
            'member-data-col-span col-span-1 grid grid-cols-1 gap-2 sm:col-span-3 sm:grid-cols-2 md:col-span-4'
          }
        >
          <div>
            <DataImageInput
              title={'Main Image'}
              name={'mainImage'}
              baseUrl={'/api/admin/projects/main-image'}
            >
              Select Main Image
            </DataImageInput>
          </div>
          <div>
            <DataMultipleImageInput
              baseUrl={'/api/admin/projects/content-image'}
              name={'contentImages'}
              title={'Images'}
            >
              Select Images
            </DataMultipleImageInput>
          </div>
        </div>
        <DataInput
          title={'Name (English)'}
          defaultValue={''}
          name={'name'}
          placeholder={'Name (English)'}
        />
        <DataInput
          title={'Name (Korean)'}
          defaultValue={''}
          name={'nameKo'}
          placeholder={'Name (Korean)'}
        />
        <DataTextarea
          defaultValue={''}
          name={'description'}
          placeholder={'Description (English)'}
        />
        <DataTextarea
          defaultValue={''}
          name={'descriptionKo'}
          placeholder={'Description (Korean)'}
        />
        <DataSelectInput
          title={'Generation'}
          data={generationList}
          name={'generationId'}
          defaultValue={''}
        />
        <MembersSelectInput membersList={membersList} defaultValue={[]} />
        <MDXEditor
          title={'Project Content (English)'}
          name={'content'}
          placeholder={'Please write content'}
        />
        <MDXEditor
          title={'Project Content (Korean)'}
          name={'contentKo'}
          placeholder={'Please write content with Korean'}
        />
        <SubmitButton />
      </DataForm>
    </AdminDefaultLayout>
  )
}
