'use client'

import acceptMemberAction from '@/app/(admin)/admin/members/accept/actions'
import { Dispatch, ReactNode, SetStateAction, useState } from 'react'
import DataForm from '@/app/components/data-form'
import SubmitButton from '@/app/components/admin/submit-button'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

/**
 * `RoleButton` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(`구조 분해된 입력값`)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
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
      className={`rounded-lg p-1 px-2 ${role === value ? 'bg-neutral-900 text-white' : 'bg-neutral-100'} transition-colors`}
      type={'button'}
      onClick={() => setRole(value)}
    >
      {children}
    </button>
  )
}

/**
 * `AcceptForm` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(`userId`)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
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
          'flex items-center gap-2 rounded-lg border-2 p-1 px-3 font-semibold transition-colors hover:bg-neutral-100'
        }
      />
    </DataForm>
  )
}
