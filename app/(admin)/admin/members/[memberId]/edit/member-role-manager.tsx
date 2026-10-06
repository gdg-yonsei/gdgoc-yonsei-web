'use client'

import { Dispatch, SetStateAction, useState } from 'react'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import { cn } from '@/lib/cn'

function RoleButton({
  role,
  value,
  setRole,
}: {
  role: string
  value: string
  setRole: Dispatch<SetStateAction<string>>
}) {
  return (
    <button
      type={'button'}
      onClick={() => setRole(value)}
      className={cn(
        'admin-btn',
        value === role
          ? 'bg-primary text-on-primary'
          : 'border-hairline bg-surface text-ink hover:bg-canvas border'
      )}
    >
      {value}
    </button>
  )
}

/** 서비스가 역할 변경 권한을 다시 확인하며, CORE는 자신보다 낮은 역할만 지정할 수 있다. */
export default function MemberRoleManager({ userRole }: { userRole: string }) {
  const { t } = useAdminI18n()
  const [role, setRole] = useState<string>(userRole)

  return (
    <div className={'flex flex-col sm:col-span-2'}>
      <p className={'admin-field-label px-0.5'}>{t('role')}</p>
      <input
        name={'role'}
        hidden={true}
        type={'text'}
        value={role}
        readOnly={true}
      />
      <div className={'grid grid-cols-2 gap-2'}>
        <RoleButton value={'UNVERIFIED'} role={role} setRole={setRole} />
        <RoleButton value={'MEMBER'} role={role} setRole={setRole} />
        <RoleButton value={'CORE'} role={role} setRole={setRole} />
        <RoleButton value={'LEAD'} role={role} setRole={setRole} />
        <RoleButton value={'ALUMNUS'} role={role} setRole={setRole} />
      </div>
    </div>
  )
}
