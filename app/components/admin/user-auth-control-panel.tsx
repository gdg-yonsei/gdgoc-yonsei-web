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
      className={'w-full p-4 rounded-xl bg-white ring-2 ring-neutral-300'}
    >
      <div className={'flex flex-col gap-1 pb-2 break-all text-sm'}>
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
          'flex gap-2 items-center w-full  justify-center bg-neutral-900 text-white p-1 px-2 rounded-full transition-all text-sm disabled:bg-neutral-800 ring-2 disabled:hover:ring-offset-0 ring-neutral-900 hover:md:ring-offset-1'
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
            'w-full p-4 rounded-xl bg-neutral-300 animate-pulse ring-2 ring-neutral-300 h-[120px]'
          }
        />
      }
    >
      <UserProfile />
    </Suspense>
  )
}
