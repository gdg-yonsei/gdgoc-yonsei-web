import { getMembers } from '@/lib/fetcher/get-members'
import Image from 'next/image'
import Link from 'next/link'
import formatUserName from '@/lib/format-user-name'

export default async function MembersTable() {
  const membersData = await getMembers()

  return (
    <div
      className={
        'w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 pt-4'
      }
    >
      {membersData.map((member) => (
        <Link
          href={`/admin/members/${member.id}`}
          key={member.id}
          className={'bg-white rounded-lg'}
        >
          <Image
            src={member.image ? member.image : '/default-user-profile.png'}
            alt={'User Profile Image'}
            width={100}
            height={100}
            className={'rounded-t-lg w-full'}
          />
          <div className={'p-2'}>
            <div className={'text-lg font-semibold'}>
              {formatUserName(member.name, member.firstName, member.lastName)}
            </div>
            <div className={'flex items-center gap-2 text-sm'}>
              {member.generation && <div>{member.generation}기</div>}
              <div>{member.role.toUpperCase()}</div>
            </div>
            <div>{member.part}</div>
          </div>
        </Link>
      ))}
    </div>
  )
}
