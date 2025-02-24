import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import { notFound } from 'next/navigation'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import DataForm from '@/app/components/data-form'
import DataInput from '@/app/components/admin/data-input'
import SubmitButton from '@/app/components/admin/submit-button'
import DataImageInput from '@/app/components/admin/data-image-input'
import DataMultipleImageInput from '@/app/components/admin/data-multiple-image-input'
import { updateSessionAction } from '@/app/(admin)/admin/sessions/[sessionId]/edit/actions'
import { getSession } from '@/lib/fetcher/admin/get-session'

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

  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={`/admin/sessions/${sessionId}`}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>{sessionData.name} Session</p>
      </AdminNavigationButton>
      <div className={'admin-title py-4'}>Edit {sessionData.name} Session</div>
      <DataForm
        action={updateSessionActionWithSessionId}
        className={'w-full gap-4 member-data-grid'}
      >
        <DataInput
          defaultValue={sessionData.name}
          name={'name'}
          placeholder={'Session Name'}
          title={'Session Name'}
        />
        <DataInput
          defaultValue={sessionData.description}
          name={'description'}
          placeholder={'Session Description'}
          title={'Session Description'}
        />
        <div
          className={
            'col-span-1 sm:col-span-3 md:col-span-4 member-data-col-span grid grid-cols-1 sm:grid-cols-2 gap-2'
          }
        >
          <div>
            <DataImageInput
              baseUrl={'/admin/sessions/main-image'}
              title={'Main Image'}
              name={'mainImage'}
              defaultValue={sessionData.mainImage}
            >
              Select Main Image
            </DataImageInput>
          </div>
          <div>
            <DataMultipleImageInput
              baseUrl={'/api/admin/sessions/content-image'}
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
