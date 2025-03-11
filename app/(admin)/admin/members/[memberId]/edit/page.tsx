import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { getMember } from '@/lib/fetcher/admin/get-member'
import formatUserName from '@/lib/format-user-name'
import { updateMemberAction } from '@/app/(admin)/admin/members/[memberId]/edit/actions'
import handlePermission from '@/lib/admin/handle-permission'
import { auth } from '@/auth'
import { forbidden } from 'next/navigation'
import ImageUpload from '@/app/(admin)/admin/members/[memberId]/edit/image-upload'
import SubmitButton from '@/app/components/admin/submit-button'
import MemberRoleManager from '@/app/(admin)/admin/members/[memberId]/edit/member-role-manager'
import DataInput from '@/app/components/admin/data-input'
import DataForm from '@/app/components/data-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Member',
}

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ memberId: string }>
}) {
  const { memberId } = await params
  // 사용자 로그인 정보 확인
  const session = await auth()
  if (
    !(await handlePermission(session?.user?.id, 'put', 'members', memberId))
  ) {
    return forbidden()
  }
  // Member 정보 가져오기
  const memberData = await getMember(memberId)
  // Member 정보 업데이트 Action
  const updateMemberActionWithMemberId = updateMemberAction.bind(null, memberId)

  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={`/admin/members/${memberId}`}>
        <ChevronLeftIcon className={'size-8'} />
        <p>{memberData.name}</p>
      </AdminNavigationButton>
      <div className={'admin-title py-4'}>
        Edit{' '}
        {formatUserName(
          memberData.name,
          memberData.firstName,
          memberData.lastName,
          memberData.isForeigner
        )}
      </div>
      <div className={'flex flex-col gap-4'}>
        <DataForm
          action={updateMemberActionWithMemberId}
          className={'w-full gap-4 member-data-grid'}
        >
          <ImageUpload
            image={memberData.image}
            memberId={memberData.id}
            name={'profileImage'}
          />
          <DataInput
            title={'Github Name*'}
            defaultValue={memberData.name}
            name={'name'}
            placeholder={'Github Name'}
          />
          <DataInput
            title={'First Name*'}
            defaultValue={memberData.firstName}
            name={'firstName'}
            placeholder={'First Name'}
          />
          <DataInput
            title={'Last Name*'}
            defaultValue={memberData.lastName}
            name={'lastName'}
            placeholder={'Last Name'}
          />
          <DataInput
            title={'E-Mail'}
            defaultValue={memberData.email}
            name={'email'}
            placeholder={'E-Mail'}
          />
          <DataInput
            title={'Github ID'}
            defaultValue={memberData.githubId}
            name={'githubId'}
            placeholder={'Github ID'}
          />
          <DataInput
            title={'Instagram ID'}
            defaultValue={memberData.instagramId}
            name={'instagramId'}
            placeholder={'Instagram ID'}
          />
          <DataInput
            title={'Linked In Profile URL'}
            defaultValue={memberData.linkedInId}
            name={'linkedInId'}
            placeholder={'Linked In Profile URL'}
          />
          <DataInput
            title={'Major'}
            defaultValue={memberData.major}
            name={'major'}
            placeholder={'Major'}
          />
          <DataInput
            title={'Student ID'}
            defaultValue={memberData.studentId}
            name={'studentId'}
            placeholder={'Student ID'}
          />
          <DataInput
            title={'Telephone'}
            defaultValue={memberData.telephone}
            name={'telephone'}
            placeholder={'Telephone (only numbers)'}
          />
          <DataInput
            title={'Foreigner'}
            defaultValue={'true'}
            name={'isForeigner'}
            placeholder={''}
            type={'checkbox'}
            isChecked={memberData.isForeigner}
          />

          {(await handlePermission(
            session?.user?.id,
            'put',
            'membersRole'
          )) && <MemberRoleManager userRole={memberData.role} />}
          <SubmitButton />
        </DataForm>
      </div>
    </AdminDefaultLayout>
  )
}
