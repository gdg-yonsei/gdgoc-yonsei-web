/**
 * 멤버 정보 수정 화면(`/admin/members/{id}/edit`).
 *
 * 레이아웃 가드(`members` 수정) 위에, 대상 역할·기수까지 보는 세밀한 판단(`authorizeMemberEdit`)을
 * 한 번 더 한다. 다른 사람의 이메일은 LEAD만 바꿀 수 있어 그 외에는 읽기 전용으로 보인다.
 */
import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { getMember } from '@/lib/server/fetcher/admin/get-member'
import { formatUserName } from '@/lib/format/user-name'
import { updateMemberAction } from '@/app/(admin)/admin/members/[memberId]/edit/actions'
import { hasPermission } from '@/lib/server/permission/has-permission'
import { requirePermission } from '@/lib/server/permission/require-permission'
import { forbidden, notFound } from 'next/navigation'
import { authorizeMemberEdit } from '@/lib/server/services/admin/members'
import { canChangeMemberEmail } from '@/lib/server/services/admin/authorize'
import { getWebActor } from '@/lib/server/services/admin/web-actor'
import ImageUpload from '@/app/(admin)/admin/members/[memberId]/edit/image-upload'
import SubmitButton from '@/app/components/admin/submit-button'
import MemberRoleManager from '@/app/(admin)/admin/members/[memberId]/edit/member-role-manager'
import DataInput from '@/app/components/admin/data-input'
import DataForm from '@/app/components/admin/data-form'
import { Metadata } from 'next'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'
import BilingualPanel from '@/app/components/admin/bilingual-panel'
import { connection } from 'next/server'

/** 브라우저 탭 제목. */
export const metadata: Metadata = {
  title: 'Edit Member',
}

/** 멤버 수정 폼. 수정할 수 없으면 403, 멤버가 없으면 404. */
export default async function EditMemberPage({
  params,
}: PageProps<'/admin/members/[memberId]/edit'>) {
  await connection()
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  const { memberId } = await params
  // 가드가 통과한 세션을 아래 역할 관리 UI 노출 여부 판단에 재사용한다.
  const session = await requirePermission('put', 'members', memberId)
  // CORE 는 낮은 역할의 멤버만 고칠 수 있고, 남의 이메일은 LEAD 만 바꾼다.
  const actor = await getWebActor()
  const editable = actor ? await authorizeMemberEdit(actor, memberId) : null
  if (!actor || !editable) forbidden()
  if (!editable.ok) {
    if (editable.code === 'NOT_FOUND') notFound()
    forbidden()
  }
  const emailReadOnly = !canChangeMemberEmail(actor, memberId)
  const memberData = await getMember(memberId)
  if (!memberData) {
    notFound()
  }
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
            readOnly={emailReadOnly}
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

          {(await hasPermission(session?.user?.id, 'put', 'membersRole')) && (
            <MemberRoleManager userRole={memberData.role} />
          )}
          <SubmitButton />
        </DataForm>
      </div>
    </AdminDefaultLayout>
  )
}
