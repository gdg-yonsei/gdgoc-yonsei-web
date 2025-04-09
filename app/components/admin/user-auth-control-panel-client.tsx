import { SignOutButton } from '@/app/components/auth/sign-out-button'
import { useSession } from 'next-auth/react'

/**
 * 사용자 정보 패널 (CSR 전용)
 * @constructor
 */
export default function UserAuthControlPanelClient() {
  const { data: session } = useSession()

  return (
    <div
      className={'w-full p-4 rounded-xl bg-white border-2 border-neutral-300'}
    >
      <div className={'flex flex-col gap-1 pb-2 break-all text-sm'}>
        <div className={'text-lg'}>{session?.user?.name}</div>
        <div>{session?.user?.email}</div>
      </div>
      <SignOutButton
        className={
          'flex gap-2 items-center w-full  justify-center bg-neutral-900 text-white p-1 px-2 rounded-full transition-all text-sm disabled:bg-neutral-800 border-2 border-neutral-900'
        }
        spinnerClassName={'size-4 border-2 border-t-white border-neutral-700'}
      />
    </div>
  )
}
