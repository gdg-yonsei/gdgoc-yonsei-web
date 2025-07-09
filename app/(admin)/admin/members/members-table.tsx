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
        'grid w-full grid-cols-1 gap-2 pt-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
      }
    >
      {membersData.map((member) => (
        <Link
          href={`/admin/members/${member.id}`}
          key={member.id}
          className={
            'flex items-center gap-2 rounded-2xl bg-white p-2 shadow-lg'
          }
        >
          <UserProfileImage
            src={member.image}
            alt={`${member.name} Profile Image`}
            width={100}
            height={100}
            className={'aspect-square w-full max-w-20 rounded-full'}
          />
          <div className={'p-2'}>
            <div className={'text-lg font-semibold'}>
              {formatUserName(member.name, member.firstName, member.lastName)}
            </div>
            <div className={'flex items-center gap-2 text-sm'}>
              {member?.generation && <div>{member.generation}</div>}
              <div>{member?.part}</div>
              <div>{member?.role.toUpperCase()}</div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
