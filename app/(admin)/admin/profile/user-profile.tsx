import { auth } from '@/auth'
import UserProfileImage from '@/app/components/user-profile-image'
import { getMember } from '@/lib/server/fetcher/admin/get-member'
import { notFound } from 'next/navigation'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'
import BilingualPanel from '@/app/components/admin/bilingual-panel'

/**
 * 사용자 정보 표시 패널
 * @constructor
 */
export default async function UserProfile() {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  const session = await auth()

  if (!session?.user?.id) {
    notFound()
  }

  const userData = await getMember(session.user.id)
  if (!userData) {
    notFound()
  }

  return (
    <div className={'member-data-grid gap-2 py-4'}>
      <UserProfileImage
        src={userData.image}
        width={100}
        height={100}
        className={'mx-auto aspect-square w-40 rounded-full'}
        alt={'User Profile Image'}
      />
      <div className={'member-data-col-span'}>
        <BilingualPanel
          enTitle={t.english}
          koTitle={t.korean}
          enContent={
            <div className={'grid grid-cols-1 gap-2 sm:grid-cols-2'}>
              <div className={'member-data-box'}>
                <div className={'member-data-title'}>{t.firstNameEn}</div>
                <div className={'member-data-content'}>{userData.firstName}</div>
              </div>
              <div className={'member-data-box'}>
                <div className={'member-data-title'}>{t.lastNameEn}</div>
                <div className={'member-data-content'}>{userData.lastName}</div>
              </div>
            </div>
          }
          koContent={
            <div className={'grid grid-cols-1 gap-2 sm:grid-cols-2'}>
              <div className={'member-data-box'}>
                <div className={'member-data-title'}>{t.firstNameKo}</div>
                <div className={'member-data-content'}>{userData.firstNameKo}</div>
              </div>
              <div className={'member-data-box'}>
                <div className={'member-data-title'}>{t.lastNameKo}</div>
                <div className={'member-data-content'}>{userData.lastNameKo}</div>
              </div>
            </div>
          }
        />
      </div>
      <div className={'member-data-box'}>
        <div className={'member-data-title'}>{t.email}</div>
        <div className={'member-data-content'}>{userData.email}</div>
      </div>
      <div className={'member-data-box'}>
        <div className={'member-data-title'}>{t.role}</div>
        <div className={'member-data-content'}>{userData.role}</div>
      </div>
      <div className={'member-data-box'}>
        <div className={'member-data-title'}>{t.part}</div>
        <div className={'member-data-content'}>{userData.part}</div>
      </div>
      <div className={'member-data-box'}>
        <div className={'member-data-title'}>{t.generation}</div>
        <div className={'member-data-content'}>{userData.generation}</div>
      </div>
      <div className={'member-data-box'}>
        <div className={'member-data-title'}>{t.studentId}</div>
        <div className={'member-data-content'}>{userData.studentId}</div>
      </div>
      <div className={'member-data-box'}>
        <div className={'member-data-title'}>{t.major}</div>
        <div className={'member-data-content'}>{userData.major}</div>
      </div>
      <div className={'member-data-box'}>
        <div className={'member-data-title'}>{t.telephone}</div>
        <div className={'member-data-content'}>{userData.telephone}</div>
      </div>
      <div className={'member-data-box'}>
        <div className={'member-data-title'}>{t.githubId}</div>
        <div className={'member-data-content'}>{userData.githubId}</div>
      </div>
      <div className={'member-data-box'}>
        <div className={'member-data-title'}>{t.instagramId}</div>
        <div className={'member-data-content'}>{userData.instagramId}</div>
      </div>
      <div className={'member-data-box'}>
        <div className={'member-data-title'}>{t.linkedInProfileUrl}</div>
        <div className={'member-data-content'}>{userData.linkedInId}</div>
      </div>
    </div>
  )
}
