import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { getMember } from '@/lib/server/fetcher/admin/get-member'
import handlePermission from '@/lib/server/permission/handle-permission'
import { auth } from '@/auth'
import { forbidden } from 'next/navigation'
import ImageUpload from '@/app/(admin)/admin/members/[memberId]/edit/image-upload'
import SubmitButton from '@/app/components/admin/submit-button'
import DataInput from '@/app/components/admin/data-input'
import DataForm from '@/app/components/data-form'
import { updateProfileAction } from '@/app/(admin)/admin/profile/edit/actions'
import { Metadata } from 'next'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'
import BilingualPanel from '@/app/components/admin/bilingual-panel'

export const metadata: Metadata = {
  title: 'Edit Profile',
}

/**
 * `EditProfilePage` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
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
export default async function EditProfilePage() {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
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
        <p>{t.profile}</p>
      </AdminNavigationButton>
      <div className={'admin-title py-4'}>
        {t.edit} {t.profile}
      </div>
      <div className={'flex flex-col gap-4'}>
        <DataForm
          action={updateProfileActionWithMemberId}
          className={'member-data-grid w-full gap-4'}
        >
          <ImageUpload
            image={memberData.image}
            memberId={memberData.id}
            name={'profileImage'}
          />

          <DataInput
            title={t.githubName}
            defaultValue={memberData.name}
            name={'name'}
            placeholder={t.githubName}
          />
          <div className={'col-span-1 sm:col-span-2 lg:col-span-4'}>
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
                    title={t.firstNameEn}
                    defaultValue={memberData.firstName}
                    name={'firstName'}
                    placeholder={'Yonsei'}
                    required={true}
                  />
                  <DataInput
                    title={t.lastNameEn}
                    defaultValue={memberData.lastName}
                    name={'lastName'}
                    placeholder={'Kim'}
                    required={true}
                  />
                </div>
              }
              koContent={
                <div className={'grid grid-cols-1 gap-2 sm:grid-cols-2'}>
                  <DataInput
                    title={t.firstNameKo}
                    defaultValue={memberData.firstNameKo}
                    name={'firstNameKo'}
                    placeholder={'연세'}
                    required={true}
                  />
                  <DataInput
                    title={t.lastNameKo}
                    defaultValue={memberData.lastNameKo}
                    name={'lastNameKo'}
                    placeholder={'김'}
                    required={true}
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
            required={true}
          />
          <DataInput
            title={t.publicGithubId}
            defaultValue={memberData.githubId}
            name={'githubId'}
            placeholder={t.githubId}
          />
          <DataInput
            title={t.publicInstagramId}
            defaultValue={memberData.instagramId}
            name={'instagramId'}
            placeholder={t.instagramId}
          />
          <DataInput
            title={t.publicLinkedInProfileUrl}
            defaultValue={memberData.linkedInId}
            name={'linkedInId'}
            placeholder={t.linkedInProfileUrl}
            type={'link'}
          />
          <DataInput
            title={t.majorKo}
            defaultValue={memberData.major}
            name={'major'}
            placeholder={'컴퓨터과학과'}
            required={true}
          />
          <DataInput
            title={t.studentId}
            defaultValue={memberData.studentId}
            name={'studentId'}
            placeholder={t.studentId}
            required={true}
          />
          <DataInput
            title={t.telephoneOnlyNumber}
            defaultValue={memberData.telephone}
            name={'telephone'}
            placeholder={'01012341234'}
            required={true}
          />
          <DataInput
            title={t.foreigner}
            defaultValue={'true'}
            name={'isForeigner'}
            placeholder={''}
            type={'checkbox'}
            isChecked={memberData.isForeigner}
          />
          <div>
            <p className={'text-lg font-semibold'}>{t.notification}</p>
            <p>
              {t.profilePrivacyNotice}{' '}
              <strong>{t.profilePrivacyNoticeStrong}</strong>
            </p>
          </div>
          <SubmitButton />
        </DataForm>
      </div>
    </AdminDefaultLayout>
  )
}
