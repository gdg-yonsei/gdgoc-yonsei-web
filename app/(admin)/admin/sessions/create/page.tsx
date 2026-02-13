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

/**
 * `CreateSessionPage` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(없음)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
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
            { name: 'General Session', value: 'General Session' },
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
