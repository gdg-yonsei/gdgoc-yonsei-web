import { Suspense } from 'react'
import { auth } from '@/auth'
import { SignOutButton } from '@/app/components/auth/sign-out-button'
import * as motion from 'motion/react-client'
import formatUserName from '@/lib/format-user-name'
import { notFound } from 'next/navigation'
import { getMember } from '@/lib/fetcher/admin/get-member'

/**
 * 사용자 정보 표시 패널
 * @constructor
 */
async function UserProfile() {
  const session = await auth()

  if (!session?.user?.id) {
    notFound()
  }

  const userData = await getMember(session.user.id)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={'w-full rounded-xl border-2 border-neutral-300 bg-white p-4'}
    >
      <div className={'flex flex-col gap-1 pb-2 text-sm break-all'}>
        <div className={'text-lg'}>
          {formatUserName(
            userData.name,
            userData.firstName,
            userData.lastName,
            userData.isForeigner
          )}
        </div>
        <div>{session?.user?.email}</div>
        <div>{userData.role}</div>
      </div>
      <SignOutButton
        className={
          'flex w-full items-center justify-center gap-2 rounded-full border-2 border-neutral-900 bg-neutral-900 p-1 px-2 text-sm text-white transition-all disabled:bg-neutral-800'
        }
        spinnerClassName={'size-4 border-2 border-t-white border-neutral-700'}
      />
    </motion.div>
  )
}

/**
 * 사용자 정보 패널 (SSR 전용)
 * @constructor
 */
export default async function UserAuthControlPanel() {
  return (
    <Suspense
      fallback={
        <div
          className={
            'h-[120px] w-full animate-pulse rounded-xl border-2 border-neutral-300 bg-neutral-300 p-4'
          }
        />
      }
    >
      <UserProfile />
    </Suspense>
  )
}
