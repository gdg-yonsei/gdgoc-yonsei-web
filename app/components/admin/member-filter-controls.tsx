'use client'

import { useState } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import {
  NO_MEMBERSHIP,
  listMembershipGenerations,
  listMembershipPartOptions,
  matchesMembershipFilter,
  memberMatchesSearch,
  normalizeMemberSearch,
  type MemberMembership,
  type NamedMember,
} from '@/lib/admin/member-options'

type FilterableMember = NamedMember & {
  memberships: readonly MemberMembership[]
}

/** 새 기수에 없는 파트 필터는 비워, 결과가 없는 상태에 갇히지 않게 한다. */
export function useMemberFilters<T extends FilterableMember>(
  members: readonly T[],
  partKey: 'part' | 'partId' = 'part'
) {
  const [query, setQuery] = useState('')
  const [generation, setGeneration] = useState('')
  const [part, setPart] = useState('')
  const normalizedQuery = normalizeMemberSearch(query)

  function changeGeneration(next: string) {
    setGeneration(next)
    if (
      part &&
      !members.some((member) =>
        matchesMembershipFilter(member.memberships, next, part, partKey)
      )
    ) {
      setPart('')
    }
  }

  return {
    query,
    setQuery,
    generation,
    changeGeneration,
    part,
    setPart,

    active: Boolean(normalizedQuery || generation || part),
    generations: listMembershipGenerations(members),

    parts:
      generation === NO_MEMBERSHIP
        ? []
        : listMembershipPartOptions(members, generation, partKey),

    matches: members.filter(
      (member) =>
        matchesMembershipFilter(
          member.memberships,
          generation,
          part,
          partKey
        ) && memberMatchesSearch(member, normalizedQuery)
    ),
  }
}

/** allowNoMembership은 파트 구성원 선택기에 소속 없음 선택지를 추가한다. */
export default function MemberFilterControls({
  filters,
  allowNoMembership = false,
}: {
  filters: ReturnType<typeof useMemberFilters>
  allowNoMembership?: boolean
}) {
  const { messages: t } = useAdminI18n()
  const showNoMembershipPart =
    allowNoMembership &&
    (!filters.generation || filters.generation === NO_MEMBERSHIP)

  return (
    <div className="admin-form-grid gap-2">
      <label className="type-caption text-ink-muted flex flex-col gap-1">
        {t.searchName}
        <span className="relative">
          <MagnifyingGlassIcon
            aria-hidden={true}
            className="text-ink-faint pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2"
          />
          <input
            className="admin-input type-body-sm pl-10"
            value={filters.query}
            onChange={(event) => filters.setQuery(event.target.value)}
            placeholder={t.memberNamePlaceholder}
          />
        </span>
      </label>
      <label className="type-caption text-ink-muted flex flex-col gap-1">
        {t.generationFilter}
        <select
          className="admin-input type-body-sm cursor-pointer"
          value={filters.generation}
          onChange={(event) => filters.changeGeneration(event.target.value)}
        >
          <option value="">{t.anyGeneration}</option>
          {allowNoMembership && (
            <option value={NO_MEMBERSHIP}>{t.noMembership}</option>
          )}
          {filters.generations.map((generation) => (
            <option key={generation} value={generation}>
              {generation}
            </option>
          ))}
        </select>
      </label>
      <label className="type-caption text-ink-muted flex flex-col gap-1">
        {t.partFilter}
        <select
          className="admin-input type-body-sm cursor-pointer"
          value={filters.part}
          onChange={(event) => filters.setPart(event.target.value)}
        >
          <option value="">{t.anyPart}</option>
          {showNoMembershipPart && (
            <option value={NO_MEMBERSHIP}>{t.noMembership}</option>
          )}
          {filters.parts.map((part) => (
            <option key={part.value} value={part.value}>
              {part.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
