'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { MagnifyingGlassIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import formatUserName from '@/lib/format-user-name'
import UserProfileImage from '@/app/components/user-profile-image'
import { type AdminMemberListItem } from '@/lib/server/fetcher/admin/get-members'
import { type AdminGenerationScope } from '@/lib/server/admin-generation-scope'
import { localizeAdminHref, type AdminMessages } from '@/lib/admin-i18n'
import { Locale } from '@/i18n-config'

interface MembersTableClientProps {
  membersData: AdminMemberListItem[]
  scope: AdminGenerationScope | null
  locale: Locale
  t: AdminMessages
}

export default function MembersTableClient({
  membersData,
  scope,
  locale,
  t,
}: MembersTableClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPart, setSelectedPart] = useState('all')
  const [selectedRole, setSelectedRole] = useState('all')
  const [sortBy, setSortBy] = useState('name') // name | part | role

  // Extract unique parts and roles for filter options
  const uniqueParts = useMemo(() => {
    const partsSet = new Set<string>()
    membersData.forEach((member) => {
      if (member.part) partsSet.add(member.part)
    })
    return Array.from(partsSet).sort()
  }, [membersData])

  const uniqueRoles = useMemo(() => {
    const rolesSet = new Set<string>()
    membersData.forEach((member) => {
      if (member.role) rolesSet.add(member.role)
    })
    return Array.from(rolesSet).sort()
  }, [membersData])

  // Filter and sort members
  const filteredAndSortedMembers = useMemo(() => {
    let result = [...membersData]

    // 1. Search Query filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter((member) => {
        const fullName = formatUserName(
          member.name,
          member.firstName,
          member.lastName,
          member.isForeigner
        ).toLowerCase()
        const fullNameKo = member.firstNameKo && member.lastNameKo
          ? formatUserName(
              member.name,
              member.firstNameKo,
              member.lastNameKo,
              member.isForeigner,
              true
            ).toLowerCase()
          : ''
        const part = (member.part ?? '').toLowerCase()
        const generation = (member.generation ?? '').toLowerCase()

        return (
          fullName.includes(q) ||
          fullNameKo.includes(q) ||
          part.includes(q) ||
          generation.includes(q)
        )
      })
    }

    // 2. Part filter
    if (selectedPart !== 'all') {
      result = result.filter((member) => member.part === selectedPart)
    }

    // 3. Role filter
    if (selectedRole !== 'all') {
      result = result.filter((member) => member.role === selectedRole)
    }

    // 4. Sort
    result.sort((left, right) => {
      if (sortBy === 'name') {
        const leftName = formatUserName(left.name, left.firstName, left.lastName, left.isForeigner)
        const rightName = formatUserName(right.name, right.firstName, right.lastName, right.isForeigner)
        return leftName.localeCompare(rightName)
      } else if (sortBy === 'part') {
        const leftPart = left.part ?? ''
        const rightPart = right.part ?? ''
        return leftPart.localeCompare(rightPart)
      } else if (sortBy === 'role') {
        return left.role.localeCompare(right.role)
      }
      return 0
    })

    return result
  }, [membersData, searchQuery, selectedPart, selectedRole, sortBy])

  // Group filtered results by generation
  const groupedMembers = useMemo(() => {
    return Object.values(
      filteredAndSortedMembers.reduce<
        Record<string, { generation: string; members: AdminMemberListItem[] }>
      >((groups, member) => {
        const key = String(member.generationId ?? 'none')
        if (!groups[key]) {
          groups[key] = {
            generation: member.generation ?? 'Unknown',
            members: [],
          }
        }
        groups[key].members.push(member)
        return groups
      }, {})
    ).sort((left, right) => {
      // Sort generation groups descending
      const leftId = left.members[0]?.generationId ?? 0
      const rightId = right.members[0]?.generationId ?? 0
      return rightId - leftId
    })
  }, [filteredAndSortedMembers])

  // CSV Export function
  const handleExportCsv = () => {
    // Columns to export
    const headers = [
      t.name,
      t.nameEn,
      t.part,
      t.role,
      t.generation,
      t.foreigner,
    ]

    const csvRows = [headers.join(',')]

    filteredAndSortedMembers.forEach((member) => {
      const nameKo = member.firstNameKo && member.lastNameKo
        ? formatUserName(
            member.name,
            member.firstNameKo,
            member.lastNameKo,
            member.isForeigner,
            true
          )
        : formatUserName(member.name, member.firstName, member.lastName, member.isForeigner)
      const nameEn = formatUserName(member.name, member.firstName, member.lastName, member.isForeigner)
      
      const row = [
        `"${(nameKo || '').replace(/"/g, '""')}"`,
        `"${(nameEn || '').replace(/"/g, '""')}"`,
        `"${(member.part || '').replace(/"/g, '""')}"`,
        `"${(member.role || '').replace(/"/g, '""')}"`,
        `"${(member.generation || '').replace(/"/g, '""')}"`,
        `"${member.isForeigner ? t.trueValue : t.falseValue}"`,
      ]
      csvRows.push(row.join(','))
    })

    const csvContent = csvRows.join('\n')
    // Add UTF-8 BOM for proper excel Korean encoding
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `members_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className={'flex flex-col gap-4'}>
      {/* Search & Filter Control Bar */}
      <div className={'flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between'}>
        <div className={'flex flex-1 flex-col gap-3 md:flex-row md:items-center'}>
          {/* Search Input */}
          <div className={'relative flex-1 w-full'}>
            <MagnifyingGlassIcon className={'absolute left-3 top-1/2 size-5 -translate-y-1/2 text-neutral-400'} />
            <input
              type={'text'}
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={'w-full rounded-xl border border-neutral-200 py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900'}
            />
          </div>

          <div className={'grid grid-cols-2 gap-2 w-full md:w-auto md:flex md:flex-row md:items-center'}>
            {/* Part Filter */}
            <select
              value={selectedPart}
              onChange={(e) => setSelectedPart(e.target.value)}
              className={'w-full rounded-xl border border-neutral-200 p-2 text-sm outline-none transition-all focus:border-neutral-900 md:w-auto'}
            >
              <option value={'all'}>{t.allParts}</option>
              {uniqueParts.map((part) => (
                <option key={part} value={part}>
                  {part}
                </option>
              ))}
            </select>

            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className={'w-full rounded-xl border border-neutral-200 p-2 text-sm outline-none transition-all focus:border-neutral-900 md:w-auto'}
            >
              <option value={'all'}>{t.allRoles}</option>
              {uniqueRoles.map((role) => (
                <option key={role} value={role}>
                  {role.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className={'flex items-center justify-between w-full md:w-auto gap-2 border-t border-neutral-100 pt-2 md:border-t-0 md:pt-0'}>
            <span className={'text-xs text-neutral-500 whitespace-nowrap'}>{t.sortBy}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={'rounded-xl border border-neutral-200 p-2 text-sm outline-none transition-all focus:border-neutral-900 w-full md:w-auto'}
            >
              <option value={'name'}>{t.sortByName}</option>
              <option value={'part'}>{t.sortByPart}</option>
              <option value={'role'}>{t.role}</option>
            </select>
          </div>
        </div>

        {/* CSV Export Button */}
        <button
          onClick={handleExportCsv}
          className={'flex w-full lg:w-auto items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-sm transition-all hover:bg-neutral-50 active:scale-95 border-t border-neutral-100 lg:border-t-0'}
        >
          <ArrowDownTrayIcon className={'size-4'} />
          <span>{t.exportCsv}</span>
        </button>
      </div>

      {/* Render Members List */}
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
                <div className={'border-b border-neutral-200 pb-1 text-sm font-semibold text-neutral-600'}>
                  {t.generation}: {group.generation}
                </div>
              )}
              <div className={'grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'}>
                {group.members.map((member) => (
                  <Link
                    href={localizeAdminHref(`/admin/members/${member.id}`, locale)}
                    key={`${group.generation}-${member.id}`}
                    className={'flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm border border-neutral-100 transition-all hover:-translate-y-0.5 hover:shadow-md'}
                  >
                    <UserProfileImage
                      src={member.image}
                      alt={`${member.name} Profile Image`}
                      width={100}
                      height={100}
                      className={'aspect-square w-14 rounded-full object-cover'}
                    />
                    <div className={'min-w-0 flex-1'}>
                      <div className={'truncate text-base font-semibold text-neutral-900'}>
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
                      <div className={'flex items-center gap-1.5 pt-1 text-xs text-neutral-600'}>
                        {scope?.kind === 'all' && member?.generation && (
                          <span className={'rounded bg-neutral-100 px-1 py-0.5'}>{member.generation}</span>
                        )}
                        {member?.part && (
                          <span className={'rounded bg-blue-50 px-1 py-0.5 text-blue-700'}>{member.part}</span>
                        )}
                        <span className={'rounded bg-neutral-100 px-1 py-0.5 font-mono'}>{member?.role.toUpperCase()}</span>
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
