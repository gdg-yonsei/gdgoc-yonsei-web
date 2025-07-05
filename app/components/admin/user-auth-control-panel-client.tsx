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
      className={'w-full rounded-xl border-2 border-neutral-300 bg-white p-4'}
    >
      <div className={'flex flex-col gap-1 pb-2 text-sm break-all'}>
        <div className={'text-lg'}>{session?.user?.name}</div>
        <div>{session?.user?.email}</div>
      </div>
      <SignOutButton
        className={
          'flex w-full items-center justify-center gap-2 rounded-full border-2 border-neutral-900 bg-neutral-900 p-1 px-2 text-sm text-white transition-all disabled:bg-neutral-800'
        }
        spinnerClassName={'size-4 border-2 border-t-white border-neutral-700'}
      />
    </div>
  )
}
