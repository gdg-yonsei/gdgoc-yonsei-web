import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { getMember } from '@/lib/server/fetcher/admin/get-member'
import formatUserName from '@/lib/format-user-name'
import { updateMemberAction } from '@/app/(admin)/admin/members/[memberId]/edit/actions'
import handlePermission from '@/lib/server/permission/handle-permission'
import { requirePermission } from '@/lib/server/permission/require-permission'
import { notFound } from 'next/navigation'
import ImageUpload from '@/app/(admin)/admin/members/[memberId]/edit/image-upload'
import SubmitButton from '@/app/components/admin/submit-button'
import MemberRoleManager from '@/app/(admin)/admin/members/[memberId]/edit/member-role-manager'
import DataInput from '@/app/components/admin/data-input'
import DataForm from '@/app/components/data-form'
import { Metadata } from 'next'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'
import BilingualPanel from '@/app/components/admin/bilingual-panel'
import { connection } from 'next/server'

export const metadata: Metadata = {
  title: 'Edit Member',
}

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ memberId: string }>
}) {
  await connection()
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  const { memberId } = await params
  // 가드가 통과한 세션을 아래 역할 관리 UI 노출 여부 판단에 재사용한다.
  const session = await requirePermission('put', 'members', memberId)
  // Member 정보 가져오기
  const memberData = await getMember(memberId)
  if (!memberData) {
    notFound()
  }
  // Member 정보 업데이트 Action
  const updateMemberActionWithMemberId = updateMemberAction.bind(null, memberId)

  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={`/admin/members/${memberId}`}>
        <ChevronLeftIcon className={'size-8'} />
        <p>{memberData.name}</p>
      </AdminNavigationButton>
      <div className={'admin-title py-4'}>
        {t.edit}{' '}
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
          className={'admin-form-grid w-full gap-4'}
        >
          <ImageUpload
            image={memberData.image}
            memberId={memberData.id}
            name={'profileImage'}
          />
          <DataInput
            title={`${t.githubName}*`}
            defaultValue={memberData.name}
            name={'name'}
            placeholder={t.githubName}
          />
          <div className={'admin-form-grid-full'}>
            <BilingualPanel
              enTitle={t.english}
              koTitle={t.korean}
              fieldLabel={t.name}
              requiredBoth={true}
              enFieldNames={['firstName', 'lastName']}
              koFieldNames={['firstNameKo', 'lastNameKo']}
              enContent={
                <div className={'grid grid-cols-1 gap-2 sm:grid-cols-2'}>
                  <DataInput
                    title={`${t.firstNameEn}*`}
                    defaultValue={memberData.firstName}
                    name={'firstName'}
                    placeholder={'Yonsei'}
                  />
                  <DataInput
                    title={`${t.lastNameEn}*`}
                    defaultValue={memberData.lastName}
                    name={'lastName'}
                    placeholder={'Kim'}
                  />
                </div>
              }
              koContent={
                <div className={'grid grid-cols-1 gap-2 sm:grid-cols-2'}>
                  <DataInput
                    title={`${t.firstNameKo}*`}
                    defaultValue={memberData.firstNameKo}
                    name={'firstNameKo'}
                    placeholder={'연세'}
                  />
                  <DataInput
                    title={`${t.lastNameKo}*`}
                    defaultValue={memberData.lastNameKo}
                    name={'lastNameKo'}
                    placeholder={'김'}
                  />
                </div>
              }
            />
          </div>
          <DataInput
            title={t.email}
            defaultValue={memberData.email}
            name={'email'}
            placeholder={t.email}
          />
          <DataInput
            title={t.githubId}
            defaultValue={memberData.githubId}
            name={'githubId'}
            placeholder={t.githubId}
          />
          <DataInput
            title={t.instagramId}
            defaultValue={memberData.instagramId}
            name={'instagramId'}
            placeholder={t.instagramId}
          />
          <DataInput
            title={t.linkedInProfileUrl}
            defaultValue={memberData.linkedInId}
            name={'linkedInId'}
            placeholder={t.linkedInProfileUrl}
            type={'link'}
          />
          <DataInput
            title={t.major}
            defaultValue={memberData.major}
            name={'major'}
            placeholder={t.major}
          />
          <DataInput
            title={t.studentId}
            defaultValue={memberData.studentId}
            name={'studentId'}
            placeholder={t.studentId}
          />
          <DataInput
            title={t.telephone}
            defaultValue={memberData.telephone}
            name={'telephone'}
            placeholder={t.telephoneOnlyNumber}
          />
          <DataInput
            title={t.foreigner}
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
