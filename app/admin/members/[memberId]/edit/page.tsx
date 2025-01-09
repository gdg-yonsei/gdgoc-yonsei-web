import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { getMember } from '@/lib/fetcher/get-member'
import formatUserName from '@/lib/format-user-name'
import Form from 'next/form'
import { updateMemberAction } from '@/app/admin/members/[memberId]/edit/actions'
import handlePermission from '@/lib/admin/handle-permission'
import { auth } from '@/auth'
import { forbidden } from 'next/navigation'
import ImageUpload from '@/app/admin/members/[memberId]/edit/image-upload'
import SubmitButton from '@/app/admin/members/[memberId]/edit/submit-button'
import MemberRoleManager from '@/app/admin/members/[memberId]/edit/member-role-manager'

function MemberDataInput({
  defaultValue,
  name,
  placeholder,
}: {
  defaultValue: string | number | undefined | null
  name: string
  placeholder: string
}) {
  return (
    <div className={'flex flex-col'}>
      <p className={'text-sm font-semibold text-neutral-700 px-1'}>
        {placeholder}
      </p>
      <input
        className={'member-data-input'}
        defaultValue={defaultValue ? defaultValue : ''}
        name={name}
        placeholder={placeholder}
      />
    </div>
  )
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
        <ImageUpload image={memberData.image} memberId={memberData.id} />
        <Form
          action={updateMemberActionWithMemberId}
          className={'w-full gap-4 member-data-grid'}
        >
          <MemberDataInput
            defaultValue={memberData.name}
            name={'name'}
            placeholder={'Github Name'}
          />
          <MemberDataInput
            defaultValue={memberData.firstName}
            name={'firstName'}
            placeholder={'First Name'}
          />
          <MemberDataInput
            defaultValue={memberData.lastName}
            name={'lastName'}
            placeholder={'Last Name'}
          />
          <MemberDataInput
            defaultValue={memberData.email}
            name={'email'}
            placeholder={'E-Mail'}
          />
          <MemberDataInput
            defaultValue={memberData.githubId}
            name={'githubId'}
            placeholder={'Github ID'}
          />
          <MemberDataInput
            defaultValue={memberData.instagramId}
            name={'instagramId'}
            placeholder={'Instagram ID'}
          />
          <MemberDataInput
            defaultValue={memberData.linkedInId}
            name={'linkedInId'}
            placeholder={'Linked In ID'}
          />
          <MemberDataInput
            defaultValue={memberData.major}
            name={'major'}
            placeholder={'Major'}
          />
          <MemberDataInput
            defaultValue={memberData.studentId}
            name={'studentId'}
            placeholder={'Student ID'}
          />
          <MemberDataInput
            defaultValue={memberData.telephone}
            name={'telephone'}
            placeholder={'Telephone (only numbers)'}
          />
          {(await handlePermission(
            session?.user?.id,
            'put',
            'membersRole'
          )) && <MemberRoleManager userRole={memberData.role} />}
          <SubmitButton />
        </Form>
      </div>
    </AdminDefaultLayout>
  )
}
