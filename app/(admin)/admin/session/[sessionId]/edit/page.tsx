import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import { notFound } from 'next/navigation'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import DataForm from '@/app/components/data-form'
import DataInput from '@/app/components/admin/data-input'
import SubmitButton from '@/app/components/admin/submit-button'
import DataImageInput from '@/app/components/admin/data-image-input'
import DataMultipleImageInput from '@/app/components/admin/data-multiple-image-input'
import { updateSessionAction } from '@/app/(admin)/admin/session/[sessionId]/edit/actions'
import { getSession } from '@/lib/fetcher/admin/get-session'
import { getGenerations } from '@/lib/fetcher/admin/get-generations'
import DataSelectInput from '@/app/components/admin/data-select-input'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Session',
}

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const sessionData = await getSession(sessionId)
  if (!sessionData) {
    notFound()
  }

  const updateSessionActionWithSessionId = updateSessionAction.bind(
    null,
    sessionId
  )

  // 기수 정보 가져오기
  const generations = await getGenerations()
  // 기수 선택용 리스트
  const generationList = generations.map((generation) => ({
    name: generation.name,
    value: String(generation.id),
  }))

  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={`/admin/session/${sessionId}`}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>{sessionData.name} Session</p>
      </AdminNavigationButton>
      <div className={'admin-title py-4'}>Edit {sessionData.name} Session</div>
      <DataForm
        action={updateSessionActionWithSessionId}
        className={'member-data-grid w-full gap-4'}
      >
        <DataInput
          defaultValue={sessionData.name}
          name={'name'}
          placeholder={'Session Name (English)'}
          title={'Session Name (English)'}
        />
        <DataInput
          defaultValue={sessionData.nameKo}
          name={'nameKo'}
          placeholder={'Session Name (Korean)'}
          title={'Session Name (Korean)'}
        />
        <DataInput
          defaultValue={sessionData.description}
          name={'description'}
          placeholder={'Session Description (English)'}
          title={'Session Description (English)'}
        />
        <DataInput
          defaultValue={sessionData.descriptionKo}
          name={'descriptionKo'}
          placeholder={'Session Description (Korean)'}
          title={'Session Description (Korean)'}
        />
        <DataInput
          defaultValue={sessionData.eventDate}
          name={'eventDate'}
          placeholder={'YYYY-MM-DD'}
          title={'Event Date'}
          type={'date'}
        />
        <DataSelectInput
          title={'Generation'}
          data={generationList}
          name={'generationId'}
          defaultValue={String(sessionData.generationId)}
        />
        <div
          className={
            'member-data-col-span col-span-1 grid grid-cols-1 gap-2 sm:col-span-3 sm:grid-cols-2 md:col-span-4'
          }
        >
          <div>
            <DataImageInput
              baseUrl={'/admin/session/main-image'}
              title={'Main Image'}
              name={'mainImage'}
              defaultValue={sessionData.mainImage}
            >
              Select Main Image
            </DataImageInput>
          </div>
          <div>
            <DataMultipleImageInput
              baseUrl={'/api/admin/session/content-image'}
              name={'contentImages'}
              title={'Images'}
              defaultValue={sessionData.images.map((image) => image)}
            >
              Select Images
            </DataMultipleImageInput>
          </div>
        </div>
        <SubmitButton />
      </DataForm>
    </AdminDefaultLayout>
  )
}
