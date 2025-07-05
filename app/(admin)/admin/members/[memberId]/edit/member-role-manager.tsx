'use client'

import { Dispatch, SetStateAction, useState } from 'react'

/**
 * Role 변경 버튼 컴포넌트
 * @param role
 * @param value
 * @param setRole
 * @constructor
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
      className={`${value === role ? 'bg-neutral-900 text-white' : ''} rounded-lg border-2 border-neutral-900 p-2 text-sm transition-all`}
    >
      {value}
    </button>
  )
}

/**
 * 멤버 Role 을 관리하는 컴포넌트
 * @param userRole - 기존 사용자 Role
 * @constructor
 */
export default function MemberRoleManager({ userRole }: { userRole: string }) {
  // 사용자 Role 상태
  const [role, setRole] = useState<string>(userRole)

  return (
    <div className={'col-span-1 flex flex-col sm:col-span-2'}>
      <p className={'px-1 text-sm font-semibold text-neutral-700'}>Role</p>
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
