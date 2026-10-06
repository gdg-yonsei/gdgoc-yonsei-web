import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { getMember } from '@/lib/server/fetcher/admin/get-member'
import { requireOwnPermission } from '@/lib/server/permission/require-permission'
import { forbidden, notFound } from 'next/navigation'
import ImageUpload from '@/app/(admin)/admin/members/[memberId]/edit/image-upload'
import SubmitButton from '@/app/components/admin/submit-button'
import DataInput from '@/app/components/admin/data-input'
import DataForm from '@/app/components/admin/data-form'
import { updateProfileAction } from '@/app/(admin)/admin/profile/edit/actions'
import { Metadata } from 'next'
import { savedVersionKey } from '@/lib/admin/form-version'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'
import BilingualPanel from '@/app/components/admin/bilingual-panel'

export const metadata: Metadata = {
  title: 'Edit Profile',
}

export default async function EditProfilePage() {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)

  const session = await requireOwnPermission('put', 'members')
  const memberId = session?.user?.id

  if (!memberId) {
    return forbidden()
  }
  const memberData = await getMember(memberId)
  if (!memberData) {
    notFound()
  }

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
        {/* 저장된 버전마다 key를 바꿔, 저장 후 돌아왔을 때 이전 편집 내용 대신 저장된 값을 보여 준다. */}
        <DataForm
          key={savedVersionKey(memberData.updatedAt)}
          action={updateProfileActionWithMemberId}
          className={'admin-form-grid w-full gap-4'}
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
