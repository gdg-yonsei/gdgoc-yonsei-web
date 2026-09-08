'use client'

import { useState } from 'react'
import { useAdminI18n } from './admin-i18n-provider'
import formatUserName from '@/lib/format-user-name'
import type { getPartMemberOptions } from '@/lib/server/fetcher/admin/get-part-member-options'

type Member = Awaited<ReturnType<typeof getPartMemberOptions>>[number]

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
  const { locale } = useAdminI18n()
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
        {ko ? '선택된 멤버' : 'Selected members'} ({selected.length})
      </div>
      <div className="flex flex-wrap gap-2">
        {selected.map((id) => {
          const member = members.find((member) => member.id === id)
          return (
            <button
              key={id}
              type="button"
              className="admin-btn"
              aria-label={`${member ? label(member) : id} ${ko ? '제거' : 'Remove'}`}
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
          {ko ? '이름 검색' : 'Search name'}
          <input
            className="admin-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={ko ? '한글·영문 이름' : 'Korean or English name'}
          />
        </label>
        <label className="flex flex-col gap-1">
          {ko ? '기수 필터' : 'Generation filter'}
          <select
            className="admin-input"
            value={generation}
            onChange={(event) => {
              setGeneration(event.target.value)
              setPart('')
            }}
          >
            <option value="">{ko ? '모든 기수' : 'All generations'}</option>
            <option value="none">{ko ? '소속 없음' : 'No membership'}</option>
            {generations.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          {ko ? '파트 필터' : 'Part filter'}
          <select
            className="admin-input"
            value={part}
            onChange={(event) => setPart(event.target.value)}
          >
            <option value="">{ko ? '모든 파트' : 'All parts'}</option>
            {(!generation || generation === 'none') && (
              <option value="none">{ko ? '소속 없음' : 'No membership'}</option>
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
          ? ko
            ? '이름을 검색하거나 기수·파트를 선택해 멤버를 찾으세요.'
            : 'Search a name or select a generation or part to find members.'
          : candidates.length === 0
            ? ko
              ? '검색 결과가 없습니다.'
              : 'No matching members.'
            : `${ko ? '검색 결과' : 'Results'}: ${candidates.length}`}
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
                .join(', ') || (ko ? '소속 없음' : 'No membership')}
            </span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}
