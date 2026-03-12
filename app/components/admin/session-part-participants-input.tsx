'use client'

import { useMemo, useState } from 'react'
import formatUserName from '@/lib/format-user-name'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

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
    defaultValue?.selectedMembers ?? parts[0]?.members.map((member) => member.id) ?? []
  )

  const currentPart = useMemo(
    () => parts.find((part) => part.id === partId) ?? null,
    [partId, parts]
  )

  return (
    <>
      <input hidden={true} name={'partId'} readOnly={true} value={String(partId)} />
      <input
        hidden={true}
        name={'participantId'}
        readOnly={true}
        value={JSON.stringify(selectedMembers)}
      />

      <div
        className={
          'col-span-1 flex h-56 w-full items-start justify-between gap-4 sm:col-span-3 md:col-span-4 xl:col-span-5'
        }
      >
        <div className={'flex h-full w-full flex-col rounded-lg bg-white p-2'}>
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
                  className={`${partId === part.id ? 'bg-neutral-950 text-white' : 'bg-neutral-100'} rounded-lg p-2 text-left`}
                >
                  <div>{part.name}</div>
                  <div className={'text-xs opacity-70'}>{part.generationName}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={'flex h-full w-full flex-col rounded-lg bg-white p-2'}>
          <p>{t('members')}</p>
          <div className={'flex-1 overflow-y-auto'}>
            <div className={'flex flex-col gap-1 pt-2'}>
              {currentPart?.members.map((member) => {
                const selected = selectedMembers.includes(member.id)

                return (
                  <button
                    key={member.id}
                    type={'button'}
                    className={`w-full rounded-lg p-2 text-left ${selected ? 'bg-neutral-950 text-white' : 'bg-neutral-100'}`}
                    onClick={() => {
                      setSelectedMembers((current) =>
                        current.includes(member.id)
                          ? current.filter((item) => item !== member.id)
                          : [...current, member.id]
                      )
                    }}
                  >
                    {member.firstNameKo
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
                        )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div
        className={
          'col-span-1 flex h-80 w-full items-start justify-between gap-4 sm:col-span-3 md:col-span-4 xl:col-span-5'
        }
      >
        <div className={'flex h-full w-full flex-col rounded-lg bg-white p-2'}>
          <p>{t('participants')}</p>
          <div className={'flex-1 overflow-y-auto'}>
            <div
              className={
                'grid grid-cols-2 gap-1 pt-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
              }
            >
              {members.map((member) => {
                const selected = selectedMembers.includes(member.id)

                return (
                  <button
                    key={member.id}
                    type={'button'}
                    className={`w-full rounded-lg border-2 border-neutral-200 p-2 text-left ${selected ? 'bg-neutral-950 text-white' : 'bg-white'}`}
                    onClick={() => {
                      setSelectedMembers((current) =>
                        current.includes(member.id)
                          ? current.filter((item) => item !== member.id)
                          : [...current, member.id]
                      )
                    }}
                  >
                    <p className={'text-xs opacity-70'}>{member.part}</p>
                    <p>
                      {member.firstNameKo
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
                          )}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
