'use client'

import actions from '@/app/(admin)/admin/members/accept/actions'
import { Dispatch, ReactNode, SetStateAction, useState } from 'react'
import DataForm from '@/app/components/data-form'
import SubmitButton from '@/app/components/admin/submit-button'

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
      className={`p-1 px-2 rounded-lg ${role === value ? 'bg-neutral-900 text-white' : 'bg-neutral-100'} transition-colors`}
      type={'button'}
      onClick={() => setRole(value)}
    >
      {children}
    </button>
  )
}

export default function AcceptForm({ userId }: { userId: string }) {
  const [role, setRole] = useState('member')

  return (
    <DataForm action={actions} className={'flex items-center gap-2'}>
      <div className={'text-lg font-semibold'}>Role</div>
      <RoleButton role={role} setRole={setRole} value={'member'}>
        Member
      </RoleButton>
      <RoleButton role={role} setRole={setRole} value={'core'}>
        Core
      </RoleButton>
      <RoleButton role={role} setRole={setRole} value={'alumni'}>
        Alumni
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
          'p-1 px-3 flex items-center gap-2 rounded-lg font-semibold border-2 hover:bg-neutral-100 transition-colors'
        }
      />
    </DataForm>
  )
}
