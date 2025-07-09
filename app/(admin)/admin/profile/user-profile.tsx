import { auth } from '@/auth'
import UserProfileImage from '@/app/components/user-profile-image'
import { getMember } from '@/lib/fetcher/admin/get-member'
import { notFound } from 'next/navigation'
import formatUserName from '@/lib/format-user-name'

/**
 * 사용자 정보 표시 패널
 * @constructor
 */
export default async function UserProfile() {
  const session = await auth()

  if (!session?.user?.id) {
    notFound()
  }

  const userData = await getMember(session.user.id)

  return (
    <div className={'member-data-grid gap-2 py-4'}>
      <UserProfileImage
        src={userData.image}
        width={100}
        height={100}
        className={'mx-auto aspect-square w-40 rounded-full'}
        alt={'User Profile Image'}
      />
      <div className={'member-data-box'}>
        <div className={'member-data-title'}>Name</div>
        <div className={'member-data-content'}>
          {formatUserName(
            userData.name,
            userData.firstName,
            userData.lastName,
            userData.isForeigner
          )}
        </div>
      </div>
      <div className={'member-data-box'}>
        <div className={'member-data-title'}>E-Mail</div>
        <div className={'member-data-content'}>{userData.email}</div>
      </div>
      <div className={'member-data-box'}>
        <div className={'member-data-title'}>Role</div>
        <div className={'member-data-content'}>{userData.role}</div>
      </div>
      <div className={'member-data-box'}>
        <div className={'member-data-title'}>Part</div>
        <div className={'member-data-content'}>{userData.part}</div>
      </div>
      <div className={'member-data-box'}>
        <div className={'member-data-title'}>Generation</div>
        <div className={'member-data-content'}>{userData.generation}</div>
      </div>
      <div className={'member-data-box'}>
        <div className={'member-data-title'}>Student ID</div>
        <div className={'member-data-content'}>{userData.studentId}</div>
      </div>
      <div className={'member-data-box'}>
        <div className={'member-data-title'}>Major</div>
        <div className={'member-data-content'}>{userData.major}</div>
      </div>
      <div className={'member-data-box'}>
        <div className={'member-data-title'}>Telephone</div>
        <div className={'member-data-content'}>{userData.telephone}</div>
      </div>
      <div className={'member-data-box'}>
        <div className={'member-data-title'}>Github ID</div>
        <div className={'member-data-content'}>{userData.githubId}</div>
      </div>
      <div className={'member-data-box'}>
        <div className={'member-data-title'}>Instagram ID</div>
        <div className={'member-data-content'}>{userData.instagramId}</div>
      </div>
      <div className={'member-data-box'}>
        <div className={'member-data-title'}>Linked In Profile URL</div>
        <div className={'member-data-content'}>{userData.linkedInId}</div>
      </div>
    </div>
  )
}
