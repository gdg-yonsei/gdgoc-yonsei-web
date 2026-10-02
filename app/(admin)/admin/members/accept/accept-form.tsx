'use client'

/**
 * 가입 승인 폼(클라이언트 컴포넌트). 부여할 역할을 고르고 승인한다.
 */
import { acceptMemberAction } from '@/app/(admin)/admin/members/accept/actions'
import { Dispatch, ReactNode, SetStateAction, useState } from 'react'
import DataForm from '@/app/components/admin/data-form'
import SubmitButton from '@/app/components/admin/submit-button'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import { cn } from '@/lib/cn'

/** 부여할 역할 하나를 고르는 토글 버튼. */
function RoleButton({
  role,
  value,
  setRole,
  children,
}: {
  role: string
  value: string
  setRole: Dispatch<SetStateAction<string>>
  children: ReactNode
}) {
  return (
    <button
      className={cn(
        'admin-btn min-h-9 px-3',
        role === value
          ? 'bg-primary text-on-primary'
          : 'border-hairline bg-surface text-ink hover:bg-canvas border'
      )}
      type={'button'}
      onClick={() => setRole(value)}
    >
      {children}
    </button>
  )
}

/**
 * 역할(멤버·코어·졸업생) 선택과 승인 버튼. 값은 `parseAcceptMemberForm`이 역할 enum으로 바꾼다.
 *
 * @param userId 승인할 사용자 id
 */
export default function AcceptForm({ userId }: { userId: string }) {
  const { t } = useAdminI18n()
  const [role, setRole] = useState('member')

  return (
    // 모바일에서는 버튼이 좁아지지 않고 다음 줄로 넘어가야 한다.
    <DataForm
      action={acceptMemberAction}
      className={'flex flex-wrap items-center gap-2'}
    >
      <span className={'admin-field-label'}>{t('role')}</span>
      <RoleButton role={role} setRole={setRole} value={'member'}>
        {t('roleMember')}
      </RoleButton>
      <RoleButton role={role} setRole={setRole} value={'core'}>
        {t('roleCore')}
      </RoleButton>
      <RoleButton role={role} setRole={setRole} value={'alumni'}>
        {t('roleAlumni')}
      </RoleButton>

      <input
        readOnly={true}
        type={'text'}
        hidden={true}
        value={role}
        name={'role'}
      />
      <input
        readOnly={true}
        type={'text'}
        hidden={true}
        value={userId}
        name={'userId'}
      />
      <SubmitButton className={'admin-btn-secondary min-h-9 px-3'} />
    </DataForm>
  )
}
