'use client'

import { useState } from 'react'
import formatUserName from '@/lib/format-user-name'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

type MemberOption = {
  id: string
  name: string | null
  firstName: string | null
  firstNameKo: string | null
  lastName: string | null
  lastNameKo: string | null
  isForeigner: boolean
  part: string | null
}

export default function MembersSelectInput({
  defaultValue,
  members,
}: {
  defaultValue: string[]
  members: MemberOption[]
}) {
  const { t } = useAdminI18n()
  const [participants, setParticipants] = useState<string[]>(defaultValue)

  return (
    <div
      className={
        'col-span-1 flex flex-col gap-2 sm:col-span-2 md:col-span-3 lg:col-span-4'
      }
    >
      <div className={'member-data-title'}>{t('participants')}</div>
      <input
        hidden={true}
        name={'participants'}
        readOnly={true}
        value={JSON.stringify(participants)}
      />
      <div className={'member-data-grid gap-2'}>
        {members.map((member) => {
          const selected = participants.includes(member.id)

          return (
            <button
              type={'button'}
              key={member.id}
              className={`rounded-xl p-2 px-4 text-left ${selected ? 'bg-neutral-900 text-white' : 'bg-white'}`}
              onClick={() => {
                setParticipants((current) =>
                  current.includes(member.id)
                    ? current.filter((item) => item !== member.id)
                    : [...current, member.id]
                )
              }}
            >
              <div className={'text-xs opacity-70'}>{member.part ?? t('part')}</div>
              <div>
                {member.firstNameKo && member.lastNameKo
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
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
