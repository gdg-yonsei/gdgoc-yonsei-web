'use client'

/** 후보 전체를 처음부터 그리지 않고, 검색·기수·파트 필터가 하나라도 있을 때만 표시한다. */
import { useState } from 'react'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import MemberFilterControls, {
  useMemberFilters,
} from '@/app/components/admin/member-filter-controls'
import { formatUserName } from '@/lib/format/user-name'
import { toMemberships } from '@/lib/admin/member-options'
import type { getPartMemberOptions } from '@/lib/server/fetcher/admin/get-part-member-options'

export type PartMemberOption = Awaited<
  ReturnType<typeof getPartMemberOptions>
>[number]

/** 선택 id를 name 필드에 JSON으로 제출하며, 소속 없음은 어느 파트에도 없는 멤버다. */
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
