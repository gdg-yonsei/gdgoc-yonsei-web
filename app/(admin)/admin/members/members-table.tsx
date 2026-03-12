import {
  getMembers,
  type AdminMemberListItem,
} from '@/lib/server/fetcher/admin/get-members'
import Link from 'next/link'
import formatUserName from '@/lib/format-user-name'
import UserProfileImage from '@/app/components/user-profile-image'
import { type AdminGenerationScope } from '@/lib/server/admin-generation-scope'
import {
  getAdminLocale,
  getAdminMessages,
  localizeAdminHref,
} from '@/lib/admin-i18n/server'

/**
 * 멤버 정보 테이블 컴포넌트
 * @constructor
 */
function groupMembersByGeneration(membersData: AdminMemberListItem[]) {
  return Object.values(
    membersData.reduce<Record<string, { generation: string; members: AdminMemberListItem[] }>>(
      (groups, member) => {
        const key = String(member.generationId ?? 'none')
        if (!groups[key]) {
          groups[key] = {
            generation: member.generation ?? 'Unknown',
            members: [],
          }
        }
        groups[key].members.push(member)
        return groups
      },
      {}
    )
  )
}

export default async function MembersTable({
  scope,
}: {
  scope: AdminGenerationScope | null
}) {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  // 멤버 정보 가져오기
  const membersData = await getMembers(scope)

  if (membersData.length === 0) {
    return (
      <div className={'rounded-2xl bg-white p-6 text-neutral-700'}>
        <div className={'font-semibold'}>{t.noScopedResults}</div>
        <div className={'pt-1 text-sm text-neutral-500'}>
          {t.noScopedResultsHint}
        </div>
      </div>
    )
  }

  const groupedMembers = groupMembersByGeneration(membersData)

  return (
    <div className={'flex flex-col gap-4 pt-4'}>
      {groupedMembers.map((group) => (
        <div key={group.generation}>
          {scope?.kind === 'all' && (
            <div
              className={'border-b-2 border-neutral-300 pb-1 text-sm text-neutral-600'}
            >
              {t.generation}: {group.generation}
            </div>
          )}
          <div
            className={
              'grid w-full grid-cols-1 gap-2 pt-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
            }
          >
            {group.members.map((member) => (
              <Link
                href={localizeAdminHref(`/admin/members/${member.id}`, locale)}
                key={`${group.generation}-${member.id}`}
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
                    {formatUserName(
                      member.name,
                      member.firstName,
                      member.lastName,
                      member.isForeigner
                    )}
                  </div>
                  <div className={'text-lg font-semibold'}>
                    {member.firstNameKo && member.lastNameKo
                      ? formatUserName(
                          member.name,
                          member.firstNameKo,
                          member.lastNameKo,
                          member.isForeigner,
                          true
                        )
                      : ''}
                  </div>
                  <div className={'flex items-center gap-2 text-sm'}>
                    {scope?.kind === 'all' && member?.generation && (
                      <div>{member.generation}</div>
                    )}
                    <div>{member?.part}</div>
                    <div>{member?.role.toUpperCase()}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
