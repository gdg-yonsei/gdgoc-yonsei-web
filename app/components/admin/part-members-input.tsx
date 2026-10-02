'use client'

/**
 * 파트 멤버 선택 입력(클라이언트 컴포넌트).
 *
 * 이름 검색과 기수·파트 필터로 후보를 좁혀 추가하고, 선택된 멤버는 칩으로 보여 준다.
 * 후보는 필터를 하나라도 입력해야 나타난다(멤버 수가 많아 전체 목록을 바로 그리지 않음).
 */
import { useState } from 'react'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import { formatUserName } from '@/lib/format/user-name'
import type { getPartMemberOptions } from '@/lib/server/fetcher/admin/get-part-member-options'

/** `getPartMemberOptions`가 돌려주는 멤버 한 명(소속 파트 포함). */
type Member = Awaited<ReturnType<typeof getPartMemberOptions>>[number]

/**
 * 선택한 멤버 id 목록을 JSON으로 `name` 필드에 싣는다.
 *
 * 기수/파트 필터의 `none`은 "어느 파트에도 속하지 않은 멤버"를 뜻한다.
 * @param members 선택지(전체 멤버)
 * @param defaultValue 처음부터 선택된 멤버 id
 */
export default function PartMembersInput({
  members,
  name,
  title,
  defaultValue,
}: {
  members: Member[]
  name: string
  title: string
  defaultValue: string[]
}) {
  const { locale, messages: t } = useAdminI18n()
  const ko = locale === 'ko'
  const [selected, setSelected] = useState(defaultValue)
  const [search, setSearch] = useState('')
  const [generation, setGeneration] = useState('')
  const [part, setPart] = useState('')
  const normalize = (value: string) =>
    value.replace(/\s/g, '').toLocaleLowerCase()
  const label = (member: Member) =>
    formatUserName(
      member.name,
      ko ? member.firstNameKo || member.firstName : member.firstName,
      ko ? member.lastNameKo || member.lastName : member.lastName,
      member.isForeigner,
      ko && !member.isForeigner
    )
  const memberships = members.flatMap((member) =>
    member.usersToParts.map(({ part }) => part)
  )
  const generations = [
    ...new Map(
      memberships.flatMap(({ generation }) =>
        generation ? [[String(generation.id), generation.name] as const] : []
      )
    ).entries(),
  ]
  const parts = [
    ...new Map(
      memberships
        .filter(
          (item) => !generation || String(item.generationsId) === generation
        )
        .map((item) => [
          String(item.id),
          !generation && item.generation
            ? `${item.generation.name} · ${item.name}`
            : item.name,
        ])
    ).entries(),
  ]
  const active = Boolean(search.trim() || generation || part)
  const candidates = active
    ? members.filter((member) => {
        if (selected.includes(member.id)) return false
        const names = [
          member.name,
          `${member.firstName ?? ''} ${member.lastName ?? ''}`,
          `${member.lastName ?? ''} ${member.firstName ?? ''}`,
          `${member.lastNameKo ?? ''}${member.firstNameKo ?? ''}`,
          `${member.firstNameKo ?? ''}${member.lastNameKo ?? ''}`,
        ]
        if (!names.some((name) => normalize(name).includes(normalize(search))))
          return false
        if (generation === 'none' || part === 'none')
          return (
            member.usersToParts.length === 0 &&
            (!generation || generation === 'none') &&
            (!part || part === 'none')
          )
        return (
          (!generation && !part) ||
          member.usersToParts.some(
            ({ part: membership }) =>
              (!generation ||
                String(membership.generationsId) === generation) &&
              (!part || String(membership.id) === part)
          )
        )
      })
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
      <div className="admin-form-grid gap-2">
        <label className="flex flex-col gap-1">
          {t.searchName}
          <input
            className="admin-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t.memberNamePlaceholder}
          />
        </label>
        <label className="flex flex-col gap-1">
          {t.generationFilter}
          <select
            className="admin-input"
            value={generation}
            onChange={(event) => {
              setGeneration(event.target.value)
              setPart('')
            }}
          >
            <option value="">{t.anyGeneration}</option>
            <option value="none">{t.noMembership}</option>
            {generations.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          {t.partFilter}
          <select
            className="admin-input"
            value={part}
            onChange={(event) => setPart(event.target.value)}
          >
            <option value="">{t.anyPart}</option>
            {(!generation || generation === 'none') && (
              <option value="none">{t.noMembership}</option>
            )}
            {parts.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p role="status" className="text-ink-muted text-sm">
        {!active
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
              {member.usersToParts
                .map(
                  ({ part }) => `${part.generation?.name ?? ''} · ${part.name}`
                )
                .join(', ') || t.noMembership}
            </span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}
