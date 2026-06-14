'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import formatUserName from '@/lib/format-user-name'
import UserProfileImage from '@/app/components/user-profile-image'
import { type AdminMemberListItem } from '@/lib/server/fetcher/admin/get-members'
import { type AdminGenerationScope } from '@/lib/server/admin-generation-scope'
import { localizeAdminHref, type AdminMessages } from '@/lib/admin-i18n'
import { Locale } from '@/i18n-config'
import AdminTableToolbar from '@/app/(admin)/admin/_components/admin-table-toolbar'
import {
  ALL_FILTER_VALUE,
  downloadCsv,
  getUniqueStringOptions,
  useFilteredSortedItems,
  useGroupedItems,
} from '@/app/(admin)/admin/_lib/admin-table-client'

interface MembersTableClientProps {
  membersData: AdminMemberListItem[]
  scope: AdminGenerationScope | null
  locale: Locale
  t: AdminMessages
}

type MemberGroup = {
  generation: string
  generationId: number
  members: AdminMemberListItem[]
}

function getEnglishMemberName(member: AdminMemberListItem) {
  return formatUserName(
    member.name,
    member.firstName,
    member.lastName,
    member.isForeigner
  )
}

function getKoreanMemberName(member: AdminMemberListItem) {
  return member.firstNameKo && member.lastNameKo
    ? formatUserName(
        member.name,
        member.firstNameKo,
        member.lastNameKo,
        member.isForeigner,
        true
      )
    : ''
}

function memberMatchesSearch(member: AdminMemberListItem, query: string) {
  const fullName = getEnglishMemberName(member).toLowerCase()
  const fullNameKo = getKoreanMemberName(member).toLowerCase()
  const part = (member.part ?? '').toLowerCase()
  const generation = (member.generation ?? '').toLowerCase()

  return (
    fullName.includes(query) ||
    fullNameKo.includes(query) ||
    part.includes(query) ||
    generation.includes(query)
  )
}

function compareMembers(
  left: AdminMemberListItem,
  right: AdminMemberListItem,
  sortBy: string
) {
  if (sortBy === 'part') {
    return (left.part ?? '').localeCompare(right.part ?? '')
  }

  if (sortBy === 'role') {
    return left.role.localeCompare(right.role)
  }

  return getEnglishMemberName(left).localeCompare(getEnglishMemberName(right))
}

function getMemberGroupKey(member: AdminMemberListItem) {
  return String(member.generationId ?? 'none')
}

function createMemberGroup(member: AdminMemberListItem): MemberGroup {
  return {
    generation: member.generation ?? 'Unknown',
    generationId: member.generationId ?? 0,
    members: [],
  }
}

function addMemberToGroup(group: MemberGroup, member: AdminMemberListItem) {
  group.members.push(member)
}

function compareMemberGroups(left: MemberGroup, right: MemberGroup) {
  return right.generationId - left.generationId
}

export default function MembersTableClient({
  membersData,
  scope,
  locale,
  t,
}: MembersTableClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPart, setSelectedPart] = useState(ALL_FILTER_VALUE)
  const [selectedRole, setSelectedRole] = useState(ALL_FILTER_VALUE)
  const [sortBy, setSortBy] = useState('name')

  const uniqueParts = useMemo(
    () => getUniqueStringOptions(membersData, (member) => member.part),
    [membersData]
  )
  const uniqueRoles = useMemo(
    () => getUniqueStringOptions(membersData, (member) => member.role),
    [membersData]
  )
  const filters = useMemo(
    () => [
      {
        value: selectedPart,
        predicate: (member: AdminMemberListItem, value: string) =>
          member.part === value,
      },
      {
        value: selectedRole,
        predicate: (member: AdminMemberListItem, value: string) =>
          member.role === value,
      },
    ],
    [selectedPart, selectedRole]
  )
  const filteredAndSortedMembers = useFilteredSortedItems({
    items: membersData,
    searchQuery,
    filters,
    sortBy,
    matchesSearch: memberMatchesSearch,
    compareItems: compareMembers,
  })
  const groupedMembers = useGroupedItems({
    items: filteredAndSortedMembers,
    getGroupKey: getMemberGroupKey,
    createGroup: createMemberGroup,
    addItem: addMemberToGroup,
    compareGroups: compareMemberGroups,
  })

  const handleExportCsv = () => {
    downloadCsv({
      filenamePrefix: 'members',
      headers: [t.name, t.nameEn, t.part, t.role, t.generation, t.foreigner],
      rows: filteredAndSortedMembers.map((member) => [
        getKoreanMemberName(member) || getEnglishMemberName(member),
        getEnglishMemberName(member),
        member.part,
        member.role,
        member.generation,
        member.isForeigner ? t.trueValue : t.falseValue,
      ]),
    })
  }

  return (
    <div className={'flex flex-col gap-4'}>
      <AdminTableToolbar
        searchValue={searchQuery}
        searchPlaceholder={t.searchPlaceholder}
        onSearchChange={setSearchQuery}
        exportLabel={t.exportCsv}
        onExportCsv={handleExportCsv}
        filterControls={[
          {
            id: 'part',
            value: selectedPart,
            onChange: setSelectedPart,
            options: [
              { value: ALL_FILTER_VALUE, label: t.allParts },
              ...uniqueParts.map((part) => ({ value: part, label: part })),
            ],
          },
          {
            id: 'role',
            value: selectedRole,
            onChange: setSelectedRole,
            options: [
              { value: ALL_FILTER_VALUE, label: t.allRoles },
              ...uniqueRoles.map((role) => ({
                value: role,
                label: role.toUpperCase(),
              })),
            ],
          },
        ]}
        sortControl={{
          id: 'sort',
          label: t.sortBy,
          value: sortBy,
          onChange: setSortBy,
          options: [
            { value: 'name', label: t.sortByName },
            { value: 'part', label: t.sortByPart },
            { value: 'role', label: t.role },
          ],
        }}
      />

      {filteredAndSortedMembers.length === 0 ? (
        <div className={'rounded-2xl bg-white p-6 text-neutral-700 shadow-sm'}>
          <div className={'font-semibold'}>{t.noScopedResults}</div>
          <div className={'pt-1 text-sm text-neutral-500'}>
            {t.noScopedResultsHint}
          </div>
        </div>
      ) : (
        <div className={'flex flex-col gap-6 pt-2'}>
          {groupedMembers.map((group) => (
            <div key={group.generation} className={'flex flex-col gap-2'}>
              {scope?.kind === 'all' && (
                <div
                  className={
                    'border-b border-neutral-200 pb-1 text-sm font-semibold text-neutral-600'
                  }
                >
                  {t.generation}: {group.generation}
                </div>
              )}
              <div
                className={
                  'grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
                }
              >
                {group.members.map((member) => (
                  <Link
                    href={localizeAdminHref(
                      `/admin/members/${member.id}`,
                      locale
                    )}
                    key={`${group.generation}-${member.id}`}
                    className={
                      'flex items-center gap-3 rounded-2xl border border-neutral-100 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md'
                    }
                  >
                    <UserProfileImage
                      src={member.image}
                      alt={`${member.name} Profile Image`}
                      width={100}
                      height={100}
                      className={'aspect-square w-14 rounded-full object-cover'}
                    />
                    <div className={'min-w-0 flex-1'}>
                      <div
                        className={
                          'truncate text-base font-semibold text-neutral-900'
                        }
                      >
                        {formatUserName(
                          member.name,
                          member.firstName,
                          member.lastName,
                          member.isForeigner
                        )}
                      </div>
                      <div className={'truncate text-sm text-neutral-500'}>
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
                      <div
                        className={
                          'flex items-center gap-1.5 pt-1 text-xs text-neutral-600'
                        }
                      >
                        {scope?.kind === 'all' && member?.generation && (
                          <span
                            className={'rounded bg-neutral-100 px-1 py-0.5'}
                          >
                            {member.generation}
                          </span>
                        )}
                        {member?.part && (
                          <span
                            className={
                              'rounded bg-blue-50 px-1 py-0.5 text-blue-700'
                            }
                          >
                            {member.part}
                          </span>
                        )}
                        <span
                          className={
                            'rounded bg-neutral-100 px-1 py-0.5 font-mono'
                          }
                        >
                          {member?.role.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
