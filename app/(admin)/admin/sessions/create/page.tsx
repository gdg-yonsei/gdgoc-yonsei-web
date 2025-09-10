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
import { getMembers } from '@/lib/server/fetcher/admin/get-members'

export const metadata: Metadata = {
  title: 'Create Session',
}

export default async function CreateSessionPage() {
  const generationData = await getParts()

  const membersData = await getMembers()

  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={'/admin/sessions'}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>Sessions</p>
      </AdminNavigationButton>
      <div className={'admin-title'}>Create Session</div>
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
          title={'English Name'}
          defaultValue={''}
          name={'name'}
          placeholder={'English Name'}
        />
        <DataInput
          title={'Korean Name'}
          defaultValue={''}
          name={'nameKo'}
          placeholder={'Korean Name'}
        />
        <DataInput
          title={'English Location'}
          defaultValue={''}
          name={'location'}
          placeholder={'English Location'}
        />
        <DataInput
          title={'Korean Location'}
          defaultValue={''}
          name={'locationKo'}
          placeholder={'Korean Location'}
        />
        <DataTextarea
          defaultValue={''}
          name={'description'}
          placeholder={'English Description'}
        />
        <DataTextarea
          defaultValue={''}
          name={'descriptionKo'}
          placeholder={'Korean Description'}
        />
        <div className={'flex flex-col gap-1'}>
          <DataInput
            title={'Internal Session'}
            defaultValue={'true'}
            name={'internalOpen'}
            placeholder={'Internal Session'}
            type={'checkbox'}
            isChecked={true}
          />
          <p className={'text-xs'}>
            An internal session can also be attended by members from other GDG
            parts.
          </p>
        </div>
        <div className={'flex flex-col gap-1'}>
          <DataInput
            title={'Public Session'}
            defaultValue={'true'}
            name={'publicOpen'}
            placeholder={'Public Session'}
            type={'checkbox'}
            isChecked={false}
          />
          <p className={'text-xs'}>
            A public session can also be attended by people who are not part of
            GDG.
          </p>
        </div>
        <DataInput
          title={'Max Capacity'}
          defaultValue={0}
          name={'maxCapacity'}
          placeholder={'Enter a number'}
          type={'number'}
        />
        <DataInput
          title={'Start time'}
          defaultValue={''}
          name={'startAt'}
          placeholder={'YYYY-MM-DDTHH:MM'}
          type={'datetime-local'}
        />
        <DataInput
          title={'End time'}
          defaultValue={''}
          name={'endAt'}
          placeholder={'YYYY-MM-DDTHH:MM'}
          type={'datetime-local'}
        />
        <SessionPartParticipantsInput
          generationData={generationData}
          membersData={membersData}
        />
        <SubmitButton />
      </DataForm>
    </AdminDefaultLayout>
  )
}
