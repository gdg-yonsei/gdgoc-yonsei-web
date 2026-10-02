'use client'

/**
 * 멤버 역할 선택 버튼 묶음(클라이언트 컴포넌트). 멤버 수정 화면에서 역할 변경 권한(`membersRole`)이 있을 때만 보인다.
 */
import { Dispatch, SetStateAction, useState } from 'react'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import { cn } from '@/lib/cn'

/**
 * 역할 하나를 고르는 토글 버튼.
 * @param role 현재 선택된 역할
 * @param value 이 버튼의 역할
 * @param setRole 선택 변경 함수
 */
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

/**
 * 역할 선택. 선택한 값은 숨은 `role` 필드로 제출되고, 실제로 바꿀 수 있는지는 서비스가
 * 다시 확인한다(CORE는 자신보다 낮은 역할만 지정 가능).
 * @param userRole 현재 역할
 */
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
