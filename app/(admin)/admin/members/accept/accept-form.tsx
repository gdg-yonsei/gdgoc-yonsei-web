'use client'

import acceptMemberAction from '@/app/(admin)/admin/members/accept/actions'
import { Dispatch, ReactNode, SetStateAction, useState } from 'react'
import DataForm from '@/app/components/data-form'
import SubmitButton from '@/app/components/admin/submit-button'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import { cn } from '@/lib/cn'

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

export default function AcceptForm({ userId }: { userId: string }) {
  const { t } = useAdminI18n()
  const [role, setRole] = useState('member')

  return (
    <DataForm action={acceptMemberAction} className={'flex items-center gap-2'}>
      <div className={'text-lg font-semibold'}>{t('role')}</div>
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
      <SubmitButton
        className={
          'hover:bg-canvas flex items-center gap-2 rounded-lg border-2 p-1 px-3 font-semibold transition-colors'
        }
      />
    </DataForm>
  )
}
