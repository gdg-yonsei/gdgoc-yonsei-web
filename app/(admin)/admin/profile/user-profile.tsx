import { getAuthSession } from '@/auth'
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
  const session = await getAuthSession()

  if (!session?.user?.id) {
    notFound()
  }

  const userData = await getMember(session.user.id)
  if (!userData) {
    notFound()
  }

  return (
    <div className={'admin-form-grid gap-2 py-4'}>
      <UserProfileImage
        src={userData.image}
        width={100}
        height={100}
        className={'mx-auto aspect-square w-40 rounded-full'}
        alt={'User Profile Image'}
      />
      <div className={'admin-form-grid-full'}>
        <BilingualPanel
          enTitle={t.english}
          koTitle={t.korean}
          enContent={
            <div className={'grid grid-cols-1 gap-2 sm:grid-cols-2'}>
              <div className={'admin-card'}>
                <div className={'admin-field-label'}>{t.firstNameEn}</div>
                <div className={'admin-field-value'}>{userData.firstName}</div>
              </div>
              <div className={'admin-card'}>
                <div className={'admin-field-label'}>{t.lastNameEn}</div>
                <div className={'admin-field-value'}>{userData.lastName}</div>
              </div>
            </div>
          }
          koContent={
            <div className={'grid grid-cols-1 gap-2 sm:grid-cols-2'}>
              <div className={'admin-card'}>
                <div className={'admin-field-label'}>{t.firstNameKo}</div>
                <div className={'admin-field-value'}>
                  {userData.firstNameKo}
                </div>
              </div>
              <div className={'admin-card'}>
                <div className={'admin-field-label'}>{t.lastNameKo}</div>
                <div className={'admin-field-value'}>{userData.lastNameKo}</div>
              </div>
            </div>
          }
        />
      </div>
      <div className={'admin-card'}>
        <div className={'admin-field-label'}>{t.email}</div>
        <div className={'admin-field-value'}>{userData.email}</div>
      </div>
      <div className={'admin-card'}>
        <div className={'admin-field-label'}>{t.role}</div>
        <div className={'admin-field-value'}>{userData.role}</div>
      </div>
      <div className={'admin-card'}>
        <div className={'admin-field-label'}>{t.part}</div>
        <div className={'admin-field-value'}>{userData.part}</div>
      </div>
      <div className={'admin-card'}>
        <div className={'admin-field-label'}>{t.generation}</div>
        <div className={'admin-field-value'}>{userData.generation}</div>
      </div>
      <div className={'admin-card'}>
        <div className={'admin-field-label'}>{t.studentId}</div>
        <div className={'admin-field-value'}>{userData.studentId}</div>
      </div>
      <div className={'admin-card'}>
        <div className={'admin-field-label'}>{t.major}</div>
        <div className={'admin-field-value'}>{userData.major}</div>
      </div>
      <div className={'admin-card'}>
        <div className={'admin-field-label'}>{t.telephone}</div>
        <div className={'admin-field-value'}>{userData.telephone}</div>
      </div>
      <div className={'admin-card'}>
        <div className={'admin-field-label'}>{t.githubId}</div>
        <div className={'admin-field-value'}>{userData.githubId}</div>
      </div>
      <div className={'admin-card'}>
        <div className={'admin-field-label'}>{t.instagramId}</div>
        <div className={'admin-field-value'}>{userData.instagramId}</div>
      </div>
      <div className={'admin-card'}>
        <div className={'admin-field-label'}>{t.linkedInProfileUrl}</div>
        <div className={'admin-field-value'}>{userData.linkedInId}</div>
      </div>
    </div>
  )
}
