import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import DataForm from '@/app/components/data-form'
import DataInput from '@/app/components/admin/data-input'
import { createSessionAction } from '@/app/(admin)/admin/sessions/create/actions'
import SubmitButton from '@/app/components/admin/submit-button'
import { Metadata } from 'next'
import { getParts } from '@/lib/server/fetcher/admin/get-parts'
import SessionPartParticipantsInput from '@/app/components/admin/session-part-participants-input'
import { getMembers } from '@/lib/server/fetcher/admin/get-members'
import MDXEditor from '@/app/components/admin/mdx-editor'
import DataSelectInput from '@/app/components/admin/data-select-input'

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
        <DataInput
          title={'English Name'}
          defaultValue={''}
          name={'name'}
          placeholder={'English Name'}
          required={true}
        />
        <DataInput
          title={'Korean Name'}
          defaultValue={''}
          name={'nameKo'}
          placeholder={'Korean Name'}
          required={true}
        />
        <DataInput
          title={'English Location'}
          defaultValue={''}
          name={'location'}
          placeholder={'English Location'}
          required={true}
        />
        <DataInput
          title={'Korean Location'}
          defaultValue={''}
          name={'locationKo'}
          placeholder={'Korean Location'}
          required={true}
        />
        <DataSelectInput
          data={[
            { name: 'T19', value: 'T19' },
            { name: 'Part Session', value: 'Part Session' },
          ]}
          name={'type'}
          title={'Session Type'}
          defaultValue={'Part Session'}
        />
        <DataInput
          title={'Display on Website'}
          defaultValue={'true'}
          name={'displayOnWebsite'}
          placeholder={'Display on Website'}
          type={'checkbox'}
          isChecked={false}
        />
        <MDXEditor
          title={'English Description'}
          name={'description'}
          placeholder={'Write the session description in English.'}
        />
        <MDXEditor
          title={'Korean Description'}
          name={'descriptionKo'}
          placeholder={'Write the session description in Korean.'}
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
          required={true}
        />
        <DataInput
          title={'Start time'}
          defaultValue={''}
          name={'startAt'}
          placeholder={'YYYY-MM-DDTHH:MM'}
          type={'datetime-local'}
          required={true}
        />
        <DataInput
          title={'End time'}
          defaultValue={''}
          name={'endAt'}
          placeholder={'YYYY-MM-DDTHH:MM'}
          type={'datetime-local'}
          required={true}
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
