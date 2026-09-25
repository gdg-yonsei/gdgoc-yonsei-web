'use client'

import { useMemo, useState } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import formatUserName from '@/lib/format-user-name'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import { cn } from '@/lib/cn'

type PartOption = {
  id: number
  name: string
  generationName: string | null
  members: Array<{
    id: string
    name: string | null
    firstName: string | null
    lastName: string | null
    firstNameKo: string | null
    lastNameKo: string | null
    isForeigner: boolean
  }>
}

type MemberOption = {
  id: string
  name: string | null
  firstName: string | null
  lastName: string | null
  firstNameKo: string | null
  lastNameKo: string | null
  isForeigner: boolean
  part: string | null
}

type NamedMember = Omit<MemberOption, 'part'>

function displayName(member: NamedMember) {
  return member.firstNameKo
    ? formatUserName(
        member.name,
        member.firstNameKo,
        member.lastNameKo,
        member.isForeigner,
        !member.isForeigner
      )
    : formatUserName(
        member.name,
        member.firstName,
        member.lastName,
        member.isForeigner
      )
}

// 한글 이름은 "김 승연"처럼 띄어 입력해도 찾을 수 있도록 공백을 제거하고 비교합니다.
function normalizeSearch(value: string) {
  return value.toLowerCase().replace(/\s+/g, '')
}

export default function SessionPartParticipantsInput({
  defaultValue,
  members,
  parts,
}: {
  defaultValue?: {
    partId: number
    selectedMembers: string[]
  }
  members: MemberOption[]
  parts: PartOption[]
}) {
  const { t } = useAdminI18n()
  const initialPartId = defaultValue?.partId ?? parts[0]?.id ?? 0
  const [partId, setPartId] = useState<number>(initialPartId)
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    defaultValue?.selectedMembers ??
      parts[0]?.members.map((member) => member.id) ??
      []
  )

  const [query, setQuery] = useState('')
  const [partFilter, setPartFilter] = useState('')

  const currentPart = useMemo(
    () => parts.find((part) => part.id === partId) ?? null,
    [partId, parts]
  )

  const memberParts = useMemo(
    () =>
      Array.from(
        new Set(
          members
            .map((member) => member.part)
            .filter((part): part is string => Boolean(part))
        )
      ).sort((a, b) => a.localeCompare(b)),
    [members]
  )

  const filteredMembers = useMemo(() => {
    const needle = normalizeSearch(query)

    return members.filter((member) => {
      if (partFilter && member.part !== partFilter) {
        return false
      }
      if (!needle) {
        return true
      }
      return normalizeSearch(
        [
          displayName(member),
          member.name,
          member.firstName,
          member.lastName,
          member.firstNameKo,
          member.lastNameKo,
        ]
          .filter(Boolean)
          .join(' ')
      ).includes(needle)
    })
  }, [members, partFilter, query])

  const allFilteredSelected =
    filteredMembers.length > 0 &&
    filteredMembers.every((member) => selectedMembers.includes(member.id))

  function toggleFilteredMembers() {
    const filteredIds = filteredMembers.map((member) => member.id)

    setSelectedMembers((current) =>
      allFilteredSelected
        ? current.filter((id) => !filteredIds.includes(id))
        : Array.from(new Set([...current, ...filteredIds]))
    )
  }

  return (
    <>
      <input
        hidden={true}
        name={'partId'}
        readOnly={true}
        value={String(partId)}
      />
      <input
        hidden={true}
        name={'participantId'}
        readOnly={true}
        value={JSON.stringify(selectedMembers)}
      />

      <div
        className={
          'admin-form-grid-full flex w-full flex-col items-stretch gap-3 lg:h-56 lg:flex-row lg:items-start'
        }
      >
        <div
          className={
            'border-hairline bg-surface flex max-h-72 w-full flex-col rounded-lg border p-2 lg:h-full lg:max-h-none'
          }
        >
          <p>{t('parts')}</p>
          <div className={'flex-1 overflow-y-auto'}>
            <div className={'flex w-full flex-col gap-2 pt-2'}>
              {parts.map((part) => (
                <button
                  key={part.id}
                  type={'button'}
                  onClick={() => {
                    setPartId(part.id)
                    setSelectedMembers(part.members.map((member) => member.id))
                  }}
                  aria-pressed={partId === part.id}
                  className={cn(
                    'admin-btn w-full justify-start text-left',
                    partId === part.id
                      ? 'bg-primary text-on-primary'
                      : 'border-hairline bg-surface text-ink hover:bg-canvas border'
                  )}
                >
                  <div>{part.name}</div>
                  <div className={'text-xs opacity-70'}>
                    {part.generationName}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          className={
            'border-hairline bg-surface flex max-h-72 w-full flex-col rounded-lg border p-2 lg:h-full lg:max-h-none'
          }
        >
          <p>{t('members')}</p>
          <div className={'flex-1 overflow-y-auto'}>
            <div className={'flex flex-col gap-1 pt-2'}>
              {currentPart?.members.map((member) => {
                const selected = selectedMembers.includes(member.id)

                return (
                  <button
                    key={member.id}
                    type={'button'}
                    aria-pressed={selected}
                    className={cn(
                      'admin-btn w-full min-w-0 justify-start text-left break-words whitespace-normal',
                      selected
                        ? 'bg-primary text-on-primary'
                        : 'border-hairline bg-surface text-ink hover:bg-canvas border'
                    )}
                    onClick={() => {
                      setSelectedMembers((current) =>
                        current.includes(member.id)
                          ? current.filter((item) => item !== member.id)
                          : [...current, member.id]
                      )
                    }}
                  >
                    {displayName(member)}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div
        className={
          'admin-form-grid-full border-hairline bg-surface flex max-h-[32rem] w-full flex-col gap-2 rounded-lg border p-2 lg:h-[28rem]'
        }
      >
        <div className={'flex flex-wrap items-center justify-between gap-2'}>
          <p>{t('participants')}</p>
          <p className={'text-ink-muted text-xs'}>
            {t('selectedCount')} {selectedMembers.length} / {members.length}
          </p>
        </div>

        <div className={'flex flex-col gap-2 md:flex-row md:items-center'}>
          <div className={'relative w-full flex-1'}>
            <MagnifyingGlassIcon
              className={
                'text-ink-faint pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2'
              }
            />
            <input
              type={'search'}
              aria-label={t('searchMemberPlaceholder')}
              placeholder={t('searchMemberPlaceholder')}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className={'admin-input type-body-sm pl-10'}
            />
          </div>
          <select
            aria-label={t('part')}
            value={partFilter}
            onChange={(event) => setPartFilter(event.target.value)}
            className={
              'admin-input type-body-sm w-full cursor-pointer md:w-auto'
            }
          >
            <option value={''}>{t('allParts')}</option>
            {memberParts.map((part) => (
              <option key={part} value={part}>
                {part}
              </option>
            ))}
          </select>
          <button
            type={'button'}
            onClick={toggleFilteredMembers}
            disabled={filteredMembers.length === 0}
            className={'admin-btn-secondary w-full md:w-auto'}
          >
            {allFilteredSelected
              ? t('deselectAllFiltered')
              : t('selectAllFiltered')}{' '}
            ({filteredMembers.length})
          </button>
        </div>

        <div className={'min-h-0 flex-1 overflow-y-auto'}>
          {filteredMembers.length === 0 ? (
            <p className={'text-ink-muted py-6 text-center text-sm'}>
              {t('noResults')}
            </p>
          ) : (
            <div
              className={
                'grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
              }
            >
              {filteredMembers.map((member) => {
                const selected = selectedMembers.includes(member.id)
                const memberName = displayName(member)

                return (
                  <button
                    key={member.id}
                    type={'button'}
                    aria-pressed={selected}
                    title={memberName}
                    className={cn(
                      'admin-btn h-auto w-full min-w-0 flex-col items-start justify-start gap-0.5 text-left whitespace-normal',
                      selected
                        ? 'bg-primary text-on-primary'
                        : 'border-hairline bg-surface text-ink hover:bg-canvas border'
                    )}
                    onClick={() => {
                      setSelectedMembers((current) =>
                        current.includes(member.id)
                          ? current.filter((item) => item !== member.id)
                          : [...current, member.id]
                      )
                    }}
                  >
                    <span className={'text-xs opacity-70'}>{member.part}</span>
                    <span className={'line-clamp-2 w-full break-words'}>
                      {memberName}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
