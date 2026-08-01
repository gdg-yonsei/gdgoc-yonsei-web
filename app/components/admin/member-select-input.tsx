'use client'

import { useState } from 'react'
import formatUserName from '@/lib/format-user-name'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import { cn } from '@/lib/cn'

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
    <div className={'admin-form-grid-full flex flex-col gap-2'}>
      <div className={'admin-field-label'}>{t('participants')}</div>
      <input
        hidden={true}
        name={'participants'}
        readOnly={true}
        value={JSON.stringify(participants)}
      />
      <div className={'admin-form-grid gap-2'}>
        {members.map((member) => {
          const selected = participants.includes(member.id)

          return (
            <button
              type={'button'}
              key={member.id}
              aria-pressed={selected}
              className={cn(
                'admin-btn h-auto flex-col items-start gap-0.5 py-2 text-left',
                selected
                  ? 'bg-primary text-on-primary'
                  : 'border-hairline bg-surface text-ink hover:bg-canvas border'
              )}
              onClick={() => {
                setParticipants((current) =>
                  current.includes(member.id)
                    ? current.filter((item) => item !== member.id)
                    : [...current, member.id]
                )
              }}
            >
              <div className={'text-xs opacity-70'}>
                {member.part ?? t('part')}
              </div>
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
