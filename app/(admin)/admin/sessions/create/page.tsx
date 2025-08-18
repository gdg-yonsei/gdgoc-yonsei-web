import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import DataForm from '@/app/components/data-form'
import DataInput from '@/app/components/admin/data-input'
import DataTextarea from '@/app/components/admin/data-textarea'
import { createSessionAction } from '@/app/(admin)/admin/sessions/create/actions'
import SubmitButton from '@/app/components/admin/submit-button'
import { Metadata } from 'next'
import { getParts } from '@/lib/server/fetcher/admin/get-parts'
import SessionPartParticipantsInput from '@/app/components/admin/session-part-participants-input'

export const metadata: Metadata = {
  title: 'Create Session',
}

export default async function CreateSessionPage() {
  const generationData = await getParts()

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
        {/*<div*/}
        {/*  className={*/}
        {/*    'member-data-col-span col-span-1 grid grid-cols-1 gap-2 sm:col-span-3 sm:grid-cols-2 md:col-span-4'*/}
        {/*  }*/}
        {/*>*/}
        {/*  <div>*/}
        {/*    <DataImageInput*/}
        {/*      title={'Main Image'}*/}
        {/*      name={'mainImage'}*/}
        {/*      baseUrl={'/api/admin/sessions/main-image'}*/}
        {/*    >*/}
        {/*      Select Main Image*/}
        {/*    </DataImageInput>*/}
        {/*  </div>*/}
        {/*  <div>*/}
        {/*    <DataMultipleImageInput*/}
        {/*      baseUrl={'/api/admin/sessions/content-image'}*/}
        {/*      name={'contentImages'}*/}
        {/*      title={'Images'}*/}
        {/*    >*/}
        {/*      Select Images*/}
        {/*    </DataMultipleImageInput>*/}
        {/*  </div>*/}
        {/*</div>*/}
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
        <DataInput
          title={'Location (English)'}
          defaultValue={''}
          name={'location'}
          placeholder={'Location (English)'}
        />
        <DataInput
          title={'Location (Korean)'}
          defaultValue={''}
          name={'locationKo'}
          placeholder={'Location (Korean)'}
        />
        <DataInput
          title={'Open Session'}
          defaultValue={'true'}
          name={'openSession'}
          placeholder={'Location (Korean)'}
          type={'checkbox'}
          isChecked={true}
        />
        <DataInput
          title={'Max Capacity'}
          defaultValue={0}
          name={'maxCapacity'}
          placeholder={'Max Capacity'}
          type={'number'}
        />
        <DataInput
          title={'Event Date'}
          defaultValue={''}
          name={'eventDate'}
          placeholder={'YYYY-MM-DD'}
          type={'date'}
        />
        <SessionPartParticipantsInput generationData={generationData} />

        <SubmitButton />
      </DataForm>
    </AdminDefaultLayout>
  )
}
