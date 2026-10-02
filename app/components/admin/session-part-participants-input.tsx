'use client'

/**
 * 세션 생성/수정 폼의 담당 파트·참가자 선택(클라이언트 컴포넌트). 순수 필터 로직은 `lib/admin/member-options.ts`에 있다.
 */
import { useState } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import {
  findMembership,
  listMembershipGenerations,
  listMembershipParts,
  memberDisplayName,
  memberMatchesSearch,
  normalizeMemberSearch,
  type MemberMembership,
} from '@/lib/admin/member-options'
import { cn } from '@/lib/cn'

/** 파트 선택지와 그 구성원. */
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

/** 참가자 후보 멤버와 소속(기수·파트) 목록. */
type MemberOption = {
  id: string
  name: string | null
  firstName: string | null
  lastName: string | null
  firstNameKo: string | null
  lastNameKo: string | null
  isForeigner: boolean
  memberships: MemberMembership[]
}

/**
 * 세션 폼의 파트·참가자 선택.
 *
 * 왼쪽에서 파트를 고르면 그 파트 구성원이 기본 참가자로 채워지고, 오른쪽에서 기수·
 * 파트·이름으로 다른 멤버를 찾아 추가하거나 뺄 수 있다. 결과는 숨은 입력
 * `partId`, `participantId`(JSON 배열)로 폼에 실린다.
 */
export default function SessionPartParticipantsInput({
  defaultValue,
  members,
  parts,
}: {
  defaultValue?: {
    partId: number | null
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
  const [generationFilter, setGenerationFilter] = useState('')
  const [partFilter, setPartFilter] = useState('')

  const currentPart = parts.find((part) => part.id === partId) ?? null
  const memberGenerations = listMembershipGenerations(members)
  // 기수를 고르면 그 기수에 있는 파트만 보여 준다.
  const memberParts = listMembershipParts(members, generationFilter)
  const normalizedQuery = normalizeMemberSearch(query)
  const filteredMembers = members.filter(
    (member) =>
      findMembership(member.memberships, generationFilter, partFilter) &&
      memberMatchesSearch(member, normalizedQuery)
  )

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
                    {memberDisplayName(member)}
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
            aria-label={t('generation')}
            value={generationFilter}
            onChange={(event) => {
              const generation = event.target.value
              setGenerationFilter(generation)
              // 새 기수에 없는 파트가 선택되어 있으면 결과가 비므로 초기화한다.
              if (
                partFilter &&
                !members.some((member) =>
                  findMembership(member.memberships, generation, partFilter)
                )
              ) {
                setPartFilter('')
              }
            }}
            className={
              'admin-input type-body-sm w-full cursor-pointer md:w-auto'
            }
          >
            <option value={''}>{t('allGenerations')}</option>
            {memberGenerations.map((generation) => (
              <option key={generation} value={generation}>
                {generation}
              </option>
            ))}
          </select>
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
                const memberName = memberDisplayName(member)
                const membership =
                  findMembership(
                    member.memberships,
                    generationFilter,
                    partFilter
                  ) ?? member.memberships[0]
                const membershipLabel = [
                  membership?.generation,
                  membership?.part,
                ]
                  .filter(Boolean)
                  .join(' · ')

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
                    <span className={'text-xs opacity-70'}>
                      {membershipLabel}
                    </span>
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
