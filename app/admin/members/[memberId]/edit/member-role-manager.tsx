'use client'

import { Dispatch, SetStateAction, useState } from 'react'

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
      className={`${value === role ? 'bg-neutral-900 text-white' : ''} p-2 rounded-lg ring-2 ring-neutral-900 text-sm transition-all`}
    >
      {value}
    </button>
  )
}

export default function MemberRoleManager({ userRole }: { userRole: string }) {
  const [role, setRole] = useState<string>(userRole)
  return (
    <div className={'flex flex-col col-span-2'}>
      <p className={'text-sm font-semibold text-neutral-700 px-1'}>Role</p>
      <input
        name={'role'}
        hidden={true}
        type={'text'}
        value={role}
        readOnly={true}
      />
      <div className={'grid grid-cols-2 gap-2'}>
        <RoleButton value={'MEMBER'} role={role} setRole={setRole} />
        <RoleButton value={'CORE'} role={role} setRole={setRole} />
        <RoleButton value={'LEAD'} role={role} setRole={setRole} />
        <RoleButton value={'ALUMNUS'} role={role} setRole={setRole} />
      </div>
    </div>
  )
}
