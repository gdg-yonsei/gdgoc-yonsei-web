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
import SubmitButton from '@/app/components/admin/submit-button'
import MemberRoleManager from '@/app/admin/members/[memberId]/edit/member-role-manager'
import DataInput from '@/app/components/admin/data-input'

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
          <DataInput
            defaultValue={memberData.name}
            name={'name'}
            placeholder={'Github Name'}
          />
          <DataInput
            defaultValue={memberData.firstName}
            name={'firstName'}
            placeholder={'First Name'}
          />
          <DataInput
            defaultValue={memberData.lastName}
            name={'lastName'}
            placeholder={'Last Name'}
          />
          <DataInput
            defaultValue={memberData.email}
            name={'email'}
            placeholder={'E-Mail'}
          />
          <DataInput
            defaultValue={memberData.githubId}
            name={'githubId'}
            placeholder={'Github ID'}
          />
          <DataInput
            defaultValue={memberData.instagramId}
            name={'instagramId'}
            placeholder={'Instagram ID'}
          />
          <DataInput
            defaultValue={memberData.linkedInId}
            name={'linkedInId'}
            placeholder={'Linked In ID'}
          />
          <DataInput
            defaultValue={memberData.major}
            name={'major'}
            placeholder={'Major'}
          />
          <DataInput
            defaultValue={memberData.studentId}
            name={'studentId'}
            placeholder={'Student ID'}
          />
          <DataInput
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
