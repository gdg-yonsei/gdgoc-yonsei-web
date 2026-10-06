'use client'

/** 목록 규모가 작아 검색·필터·정렬은 서버 왕복 없이 브라우저에서 처리한다. */
import { useState } from 'react'
import UserProfileImage from '@/app/components/admin/user-profile-image'
import type { AdminColumn } from '@/app/components/admin/data-table'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import AdminTableToolbar from '@/app/(admin)/admin/_components/admin-table-toolbar'
import GenerationGroupedTables from '@/app/(admin)/admin/_components/generation-grouped-tables'
import {
  ALL_FILTER_VALUE,
  downloadCsv,
  filterAndSortItems,
  getUniqueStringOptions,
  groupByGeneration,
} from '@/app/(admin)/admin/_lib/admin-table-client'
import { localizeAdminHref } from '@/lib/admin-i18n'
import { formatUserName } from '@/lib/format/user-name'
import type { AdminGenerationScope } from '@/lib/server/admin-generation-scope'
import type { AdminMemberListItem } from '@/lib/server/fetcher/admin/get-members'

/** 영문 표기 이름(외국인이면 이름 성, 아니면 성 이름). */
function getEnglishMemberName(member: AdminMemberListItem) {
  return formatUserName(
    member.name,
    member.firstName,
    member.lastName,
    member.isForeigner
  )
}

/** 한글 이름. 한글 성·이름이 모두 있을 때만 만든다. */
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

/** 영문·한글 이름, 파트, 기수 중 하나라도 검색어를 포함하면 일치. */
function memberMatchesSearch(member: AdminMemberListItem, query: string) {
  return [
    getEnglishMemberName(member),
    getKoreanMemberName(member),
    member.part ?? '',
    member.generation ?? '',
  ].some((text) => text.toLowerCase().includes(query))
}

function compareMembers(
  left: AdminMemberListItem,
  right: AdminMemberListItem,
  sortBy: string
) {
  if (sortBy === 'part')
    return (left.part ?? '').localeCompare(right.part ?? '')
  if (sortBy === 'role') return left.role.localeCompare(right.role)
  return getEnglishMemberName(left).localeCompare(getEnglishMemberName(right))
}

export default function MembersTableClient({
  membersData,
  scope,
}: {
  membersData: AdminMemberListItem[]
  scope: AdminGenerationScope | null
}) {
  const { locale, messages: t } = useAdminI18n()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPart, setSelectedPart] = useState(ALL_FILTER_VALUE)
  const [selectedRole, setSelectedRole] = useState(ALL_FILTER_VALUE)
  const [sortBy, setSortBy] = useState('name')

  const uniqueParts = getUniqueStringOptions(
    membersData,
    (member) => member.part
  )
  const uniqueRoles = getUniqueStringOptions(
    membersData,
    (member) => member.role
  )
  const filteredMembers = filterAndSortItems({
    items: membersData,
    searchQuery,
    filters: [
      {
        value: selectedPart,
        predicate: (member, value) => member.part === value,
      },
      {
        value: selectedRole,
        predicate: (member, value) => member.role === value,
      },
    ],
    sortBy,
    matchesSearch: memberMatchesSearch,
    compareItems: compareMembers,
  })
  const groups = groupByGeneration(filteredMembers, (member) => ({
    id: member.generationId,
    name: member.generation,
  }))

  const columns: AdminColumn<AdminMemberListItem>[] = [
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
            {/* e2e가 이름의 정확한 텍스트를 찾으므로, 이름은 단일 요소에 유지한다. */}
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
          <span className={'text-ink-faint'}>{t.notProvided}</span>
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
      render: (member) => member.generation ?? t.notProvided,
    },
  ]

  const handleExportCsv = () => {
    downloadCsv({
      filenamePrefix: 'members',
      headers: [t.name, t.nameEn, t.part, t.role, t.generation, t.foreigner],
      rows: filteredMembers.map((member) => [
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
      <GenerationGroupedTables
        groups={groups}
        showGenerationHeadings={scope?.kind === 'all'}
        captionLabel={t.members}
        columns={columns}
        getKey={(member) => member.id}
        getHref={(member) =>
          localizeAdminHref(`/admin/members/${member.id}`, locale)
        }
      />
    </div>
  )
}
