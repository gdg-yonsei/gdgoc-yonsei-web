import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { getMember } from '@/lib/fetcher/admin/get-member'
import handlePermission from '@/lib/admin/handle-permission'
import { auth } from '@/auth'
import { forbidden } from 'next/navigation'
import ImageUpload from '@/app/(admin)/admin/members/[memberId]/edit/image-upload'
import SubmitButton from '@/app/components/admin/submit-button'
import DataInput from '@/app/components/admin/data-input'
import DataForm from '@/app/components/data-form'
import { updateProfileAction } from '@/app/(admin)/admin/profile/edit/actions'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Profile',
}

export default async function EditProfilePage() {
  // 사용자 로그인 정보 확인
  const session = await auth()

  const memberId = session?.user?.id

  if (
    !memberId ||
    !(await handlePermission(session?.user?.id, 'put', 'members', memberId))
  ) {
    return forbidden()
  }
  // Member 정보 가져오기
  const memberData = await getMember(memberId)

  // Member 정보 업데이트 Action
  const updateProfileActionWithMemberId = updateProfileAction.bind(
    null,
    memberId
  )

  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={`/admin/profile`}>
        <ChevronLeftIcon className={'size-8'} />
        <p>Profile</p>
      </AdminNavigationButton>
      <div className={'admin-title py-4'}>Edit Profile</div>
      <div className={'flex flex-col gap-4'}>
        <DataForm
          action={updateProfileActionWithMemberId}
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
            title={'First Name* (Public)'}
            defaultValue={memberData.firstName}
            name={'firstName'}
            placeholder={'First Name'}
          />
          <DataInput
            title={'Last Name* (Public)'}
            defaultValue={memberData.lastName}
            name={'lastName'}
            placeholder={'Last Name'}
          />
          <DataInput
            title={'E-Mail (Public)'}
            defaultValue={memberData.email}
            name={'email'}
            placeholder={'E-Mail'}
          />
          <DataInput
            title={'Github ID (Public)'}
            defaultValue={memberData.githubId}
            name={'githubId'}
            placeholder={'Github ID'}
          />
          <DataInput
            title={'Instagram ID (Public)'}
            defaultValue={memberData.instagramId}
            name={'instagramId'}
            placeholder={'Instagram ID'}
          />
          <DataInput
            title={'Linked In Profile URL (Public)'}
            defaultValue={memberData.linkedInId}
            name={'linkedInId'}
            placeholder={'Linked In Profile URL'}
            type={'link'}
          />
          <DataInput
            title={'Major (Private)'}
            defaultValue={memberData.major}
            name={'major'}
            placeholder={'Major'}
          />
          <DataInput
            title={'Student ID (Private)'}
            defaultValue={memberData.studentId}
            name={'studentId'}
            placeholder={'Student ID'}
          />
          <DataInput
            title={'Telephone (Private)'}
            defaultValue={memberData.telephone}
            name={'telephone'}
            placeholder={'Telephone (only numbers)'}
          />
          <DataInput
            title={'Foreigner (Used only for displaying the name.)'}
            defaultValue={'true'}
            name={'isForeigner'}
            placeholder={''}
            type={'checkbox'}
            isChecked={memberData.isForeigner}
          />
          <div>
            <p className={'text-lg font-semibold'}>Notification</p>
            <p>
              Please leave the fields blank for any information you do not wish
              to disclose.{' '}
              <strong>
                Your major, student ID number, and phone number will not be made
                public.
              </strong>
            </p>
          </div>
          <SubmitButton />
        </DataForm>
      </div>
    </AdminDefaultLayout>
  )
}
