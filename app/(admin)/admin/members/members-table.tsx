import { getMembers } from '@/lib/fetcher/admin/get-members'
import Link from 'next/link'
import formatUserName from '@/lib/format-user-name'
import UserProfileImage from '@/app/components/user-profile-image'

/**
 * 멤버 정보 테이블 컴포넌트
 * @constructor
 */
export default async function MembersTable() {
  // 멤버 정보 가져오기
  const membersData = await getMembers()

  return (
    <div
      className={
        'grid w-full grid-cols-2 gap-2 pt-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5'
      }
    >
      {membersData.map((member) => (
        <Link
          href={`/admin/members/${member.id}`}
          key={member.id}
          className={'rounded-lg bg-white'}
        >
          <UserProfileImage
            src={member.image}
            alt={`${member.name} Profile Image`}
            width={100}
            height={100}
            className={'aspect-41/55 w-full rounded-t-lg'}
          />
          <div className={'p-2'}>
            <div className={'text-lg font-semibold'}>
              {formatUserName(member.name, member.firstName, member.lastName)}
            </div>
            <div className={'flex items-center gap-2 text-sm'}>
              {member.generation && <div>{member.generation}</div>}
              <div>{member.role.toUpperCase()}</div>
              <div>{member.part}</div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
