'use client'

/**
 * 참가자 여러 명을 토글 버튼으로 고르는 입력(클라이언트 컴포넌트). 선택한 id 목록을 JSON으로 `participants` 필드에 싣는다.
 */
import { useState } from 'react'
import { formatUserName } from '@/lib/format/user-name'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import { cn } from '@/lib/cn'

/** 선택지로 보여 줄 멤버. */
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

/**
 * 멤버 토글 목록. 한국어 이름이 있으면 한국어 이름을, 없으면 영어 이름을 보여 준다.
 *
 * @param defaultValue 처음부터 선택된 멤버 id
 * @param members 선택지
 */
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
                'admin-btn h-auto min-w-0 flex-col items-start gap-0.5 py-2 text-left break-words whitespace-normal',
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
