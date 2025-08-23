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
import { getSession } from '@/lib/server/fetcher/admin/get-session'
import { Metadata } from 'next'
import SessionPartParticipantsInput from '@/app/components/admin/session-part-participants-input'
import { getParts } from '@/lib/server/fetcher/admin/get-parts'

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
  const generationData = await getParts()

  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={`/admin/sessions/${sessionId}`}>
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
          title={'Location (English)'}
          defaultValue={sessionData.location}
          name={'location'}
          placeholder={'Location (English)'}
        />
        <DataInput
          title={'Location (Korean)'}
          defaultValue={sessionData.locationKo}
          name={'locationKo'}
          placeholder={'Location (Korean)'}
        />
        <DataInput
          title={'Internal Open'}
          name={'internalOpen'}
          placeholder={'Internal Open'}
          type={'checkbox'}
          defaultValue={'true'}
          isChecked={sessionData.internalOpen!}
        />
        <DataInput
          title={'Public Open'}
          name={'publicOpen'}
          placeholder={'Public Open'}
          type={'checkbox'}
          defaultValue={'true'}
          isChecked={sessionData.publicOpen!}
        />
        <DataInput
          title={'Max Capacity'}
          defaultValue={sessionData.maxCapacity}
          name={'maxCapacity'}
          placeholder={'Max Capacity'}
          type={'number'}
        />
        <DataInput
          defaultValue={sessionData.startAt?.toISOString().slice(0, 16)}
          name={'startAt'}
          placeholder={'YYYY-MM-DD'}
          title={'Start Time'}
          type={'datetime-local'}
        />
        <DataInput
          defaultValue={sessionData.endAt?.toISOString().slice(0, 16)}
          name={'endAt'}
          placeholder={'YYYY-MM-DD'}
          title={'End Time'}
          type={'datetime-local'}
        />
        <SessionPartParticipantsInput
          generationData={generationData}
          defaultValue={{
            partId: sessionData.partId,
            selectedMembers: sessionData.userToSession.map(
              (user) => user.userId
            ),
          }}
        />

        <div
          className={
            'member-data-col-span col-span-1 grid grid-cols-1 gap-2 sm:col-span-3 sm:grid-cols-2 md:col-span-4'
          }
        >
          <div>
            <DataImageInput
              baseUrl={'/api/admin/sessions/main-image'}
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
