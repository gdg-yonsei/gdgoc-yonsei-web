import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import DataForm from '@/app/components/data-form'
import DataImageInput from '@/app/components/admin/data-image-input'
import DataMultipleImageInput from '@/app/components/admin/data-multiple-image-input'
import DataInput from '@/app/components/admin/data-input'
import DataTextarea from '@/app/components/admin/data-textarea'
import { createSessionAction } from '@/app/(admin)/admin/sessions/create/actions'
import SubmitButton from '@/app/components/admin/submit-button'
import DataSelectInput from '@/app/components/admin/data-select-input'
import { getGenerations } from '@/lib/fetcher/admin/get-generations'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Session',
}

export default async function CreateSessionPage() {
  // 기수 정보 가져오기
  const generations = await getGenerations()
  // 기수 선택용 리스트
  const generationList = generations.map((generation) => ({
    name: generation.name,
    value: String(generation.id),
  }))

  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={'/admin/sessions'}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>Sessions</p>
      </AdminNavigationButton>
      <div className={'admin-title'}>Create New Session</div>
      <DataForm
        action={createSessionAction}
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
              baseUrl={'/api/admin/sessions/main-image'}
            >
              Select Main Image
            </DataImageInput>
          </div>
          <div>
            <DataMultipleImageInput
              baseUrl={'/api/admin/sessions/content-image'}
              name={'contentImages'}
              title={'Images'}
            >
              Select Images
            </DataMultipleImageInput>
          </div>
        </div>
        <DataInput
          title={'Name'}
          defaultValue={''}
          name={'name'}
          placeholder={'Name'}
        />
        <DataTextarea
          defaultValue={''}
          name={'description'}
          placeholder={'Description'}
        />
        <DataInput
          title={'Event Date'}
          defaultValue={''}
          name={'eventDate'}
          placeholder={'YYYY-MM-DD'}
          type={'date'}
        />
        <DataSelectInput
          title={'Generation'}
          data={generationList}
          name={'generationId'}
          defaultValue={generationList[0]?.value}
        />
        <SubmitButton />
      </DataForm>
    </AdminDefaultLayout>
  )
}
