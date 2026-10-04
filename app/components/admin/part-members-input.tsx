'use client'

/**
 * 파트 멤버 선택 입력(클라이언트 컴포넌트).
 *
 * 이름 검색과 기수·파트 필터(`MemberFilterControls`, 세션 참가자 선택기와 공용)로 후보를 좁혀 추가하고,
 * 선택된 멤버는 칩으로 보여 준다. 후보는 필터를 하나라도 입력해야 나타난다(멤버 수가 많아 전체 목록을
 * 바로 그리지 않음).
 */
import { useState } from 'react'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import MemberFilterControls, {
  useMemberFilters,
} from '@/app/components/admin/member-filter-controls'
import { formatUserName } from '@/lib/format/user-name'
import { toMemberships } from '@/lib/admin/member-options'
import type { getPartMemberOptions } from '@/lib/server/fetcher/admin/get-part-member-options'

/** `getPartMemberOptions`가 돌려주는 멤버 한 명(소속 파트 포함). */
export type PartMemberOption = Awaited<
  ReturnType<typeof getPartMemberOptions>
>[number]

/**
 * 선택한 멤버 id 목록을 JSON으로 `name` 필드에 싣는다.
 *
 * 기수/파트 필터의 "소속 없음"은 어느 파트에도 속하지 않은 멤버를 뜻한다.
 * @param members 선택지(전체 멤버)
 * @param defaultValue 처음부터 선택된 멤버 id
 */
export default function PartMembersInput({
  members,
  name,
  title,
  defaultValue,
}: {
  members: PartMemberOption[]
  name: string
  title: string
  defaultValue: string[]
}) {
  const { locale, messages: t } = useAdminI18n()
  const ko = locale === 'ko'
  const [selected, setSelected] = useState(defaultValue)
  const options = members.map((member) => ({
    ...member,
    memberships: toMemberships(member.usersToParts),
  }))
  const filters = useMemberFilters(options, 'partId')
  const label = (member: PartMemberOption) =>
    formatUserName(
      member.name,
      ko ? member.firstNameKo || member.firstName : member.firstName,
      ko ? member.lastNameKo || member.lastName : member.lastName,
      member.isForeigner,
      ko && !member.isForeigner
    )
  const candidates = filters.active
    ? filters.matches.filter((member) => !selected.includes(member.id))
    : []

  return (
    <fieldset className="admin-form-grid-full flex min-w-0 flex-col gap-3">
      <legend className="admin-field-label mb-2">{title}</legend>
      <input type="hidden" name={name} value={JSON.stringify(selected)} />
      <div className="admin-field-label">
        {t.selectedMembers} ({selected.length})
      </div>
      <div className="flex flex-wrap gap-2">
        {selected.map((id) => {
          const member = members.find((member) => member.id === id)
          return (
            <button
              key={id}
              type="button"
              className="admin-btn"
              aria-label={`${member ? label(member) : id} ${t.removeMember}`}
              onClick={() =>
                setSelected((current) =>
                  current.filter((value) => value !== id)
                )
              }
            >
              {member ? label(member) : id} ×
            </button>
          )
        })}
      </div>
      <MemberFilterControls filters={filters} allowNoMembership={true} />
      <p role="status" className="text-ink-muted text-sm">
        {!filters.active
          ? t.memberPickerHint
          : candidates.length === 0
            ? t.noMatchingMembers
            : `${t.searchResults}: ${candidates.length}`}
      </p>
      <div className="admin-form-grid max-h-80 gap-2 overflow-y-auto">
        {candidates.map((member) => (
          <button
            key={member.id}
            type="button"
            className="admin-btn h-auto flex-col items-start text-left"
            onClick={() => setSelected((current) => [...current, member.id])}
          >
            <span>{label(member)}</span>
            <span className="text-ink-muted text-xs">
              {member.memberships
                .map(({ generation, part }) => `${generation ?? ''} · ${part}`)
                .join(', ') || t.noMembership}
            </span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}
