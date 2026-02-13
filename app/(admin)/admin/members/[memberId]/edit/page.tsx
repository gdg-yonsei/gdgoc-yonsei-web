import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { getMember } from '@/lib/server/fetcher/admin/get-member'
import formatUserName from '@/lib/format-user-name'
import { updateMemberAction } from '@/app/(admin)/admin/members/[memberId]/edit/actions'
import handlePermission from '@/lib/server/permission/handle-permission'
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

/**
 * `EditMemberPage` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(`구조 분해된 입력값`)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
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
          className={'member-data-grid w-full gap-4'}
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
            title={'First Name (English)*'}
            defaultValue={memberData.firstName}
            name={'firstName'}
            placeholder={'Yonsei'}
          />
          <DataInput
            title={'Last Name (English)*'}
            defaultValue={memberData.lastName}
            name={'lastName'}
            placeholder={'Kim'}
          />
          <DataInput
            title={'First Name (Korean)*'}
            defaultValue={memberData.firstNameKo}
            name={'firstNameKo'}
            placeholder={'연세'}
          />
          <DataInput
            title={'Last Name (Korean)*'}
            defaultValue={memberData.lastNameKo}
            name={'lastNameKo'}
            placeholder={'김'}
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
            type={'link'}
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
