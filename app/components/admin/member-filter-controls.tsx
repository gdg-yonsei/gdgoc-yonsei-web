'use client'

/**
 * 관리자 멤버 선택기(세션 참가자, 파트 구성원)가 함께 쓰는 검색·기수·파트 필터(클라이언트 컴포넌트).
 * 필터 상태와 결과는 `useMemberFilters`가, 화면은 `MemberFilterControls`가 맡는다. 순수 규칙은
 * `lib/admin/member-options.ts`에 있다.
 */
import { useState } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import {
  NO_MEMBERSHIP,
  listMembershipGenerations,
  listMembershipParts,
  matchesMembershipFilter,
  memberMatchesSearch,
  normalizeMemberSearch,
  type MemberMembership,
  type NamedMember,
} from '@/lib/admin/member-options'

/** 필터할 수 있는 멤버: 이름 필드와 소속 목록. */
type FilterableMember = NamedMember & {
  memberships: readonly MemberMembership[]
}

/**
 * 멤버 목록의 검색어·기수·파트 필터 상태와 그 결과.
 *
 * 기수를 바꿨을 때 고른 파트가 새 기수에 없으면 결과가 비므로 파트 필터를 비운다.
 */
export function useMemberFilters<T extends FilterableMember>(
  members: readonly T[]
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
        matchesMembershipFilter(member.memberships, next, part)
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
    /** 검색어나 필터가 하나라도 있는지. */
    active: Boolean(normalizedQuery || generation || part),
    generations: listMembershipGenerations(members),
    // 기수를 고르면 그 기수에 있는 파트만 보여 준다.
    parts:
      generation === NO_MEMBERSHIP
        ? []
        : listMembershipParts(members, generation),
    /** 필터와 검색어에 맞는 멤버. */
    matches: members.filter(
      (member) =>
        matchesMembershipFilter(member.memberships, generation, part) &&
        memberMatchesSearch(member, normalizedQuery)
    ),
  }
}

/**
 * 이름 검색 입력과 기수·파트 선택.
 *
 * @param filters `useMemberFilters`의 반환값
 * @param allowNoMembership 기수·파트 선택지에 "소속 없음"을 넣는다(파트 구성원 선택기)
 */
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
            <option key={part} value={part}>
              {part}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
