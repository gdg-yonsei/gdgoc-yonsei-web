'use client'

import { useState, useMemo } from 'react'
import formatUserName from '@/lib/format-user-name'
import UserProfileImage from '@/app/components/user-profile-image'
import AdminDataTable, {
  type AdminColumn,
} from '@/app/components/admin/data-table'
import AdminEmptyState from '@/app/components/admin/empty-state'
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

  const columns = useMemo<AdminColumn<AdminMemberListItem>[]>(
    () => [
      {
        key: 'name',
        header: t.columnName,
        width: 'minmax(0,2fr)',
        primary: true,
        render: (member) => (
          <span className={'flex min-w-0 items-center gap-2.5'}>
            <UserProfileImage
              src={member.image}
              alt={''}
              width={80}
              height={80}
              className={'aspect-square w-8 shrink-0 rounded-full object-cover'}
            />
            <span className={'flex min-w-0 flex-col'}>
              {/* e2e가 `getByText(name, { exact: true })`로 찾으므로
                  이름은 반드시 단일 요소의 텍스트로 남아야 합니다. */}
              <span className={'truncate'}>{getEnglishMemberName(member)}</span>
              {getKoreanMemberName(member) && (
                <span className={'type-eyebrow text-ink-muted truncate'}>
                  {getKoreanMemberName(member)}
                </span>
              )}
            </span>
          </span>
        ),
      },
      {
        key: 'part',
        header: t.columnPart,
        width: 'minmax(0,1fr)',
        render: (member) =>
          member.part ? (
            <span className={'admin-badge-primary'}>{member.part}</span>
          ) : (
            <span className={'text-ink-faint'}>—</span>
          ),
      },
      {
        key: 'role',
        header: t.columnRole,
        width: '7rem',
        render: (member) => (
          <span className={'admin-badge-neutral'}>
            {member.role.toUpperCase()}
          </span>
        ),
      },
      {
        key: 'generation',
        header: t.columnGeneration,
        width: '8rem',
        hideOnMobile: scope?.kind !== 'all',
        render: (member) => member.generation ?? '—',
      },
    ],
    [t, scope]
  )

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
        <AdminEmptyState
          title={t.noScopedResults}
          description={t.noScopedResultsHint}
        />
      ) : (
        <div className={'flex flex-col gap-6'}>
          {groupedMembers.map((group) => (
            <div key={group.generation} className={'flex flex-col gap-2'}>
              {scope?.kind === 'all' && (
                <h2 className={'admin-field-label'}>
                  {t.generation}: {group.generation}
                </h2>
              )}
              <AdminDataTable
                items={group.members}
                caption={`${t.members} — ${group.generation}`}
                getKey={(member) => member.id}
                getHref={(member) =>
                  localizeAdminHref(`/admin/members/${member.id}`, locale)
                }
                columns={columns}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
