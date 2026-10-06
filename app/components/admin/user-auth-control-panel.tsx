import { Suspense } from 'react'
import { getAuthSession } from '@/auth'
import { SignOutButton } from '@/app/components/auth/sign-out-button'
import * as motion from 'motion/react-client'
import { formatUserName } from '@/lib/format/user-name'
import { notFound } from 'next/navigation'
import { getMember } from '@/lib/server/fetcher/admin/get-member'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'
import { AdminCardSkeleton } from '@/app/components/admin/skeleton'

/** 세션이 없으면 404, 사용자 행이 없으면 아무것도 렌더링하지 않는다. */
async function UserProfile() {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  const session = await getAuthSession()

  if (!session?.user?.id) {
    notFound()
  }

  const userData = await getMember(session.user.id)

  if (!userData) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={'border-hairline bg-canvas w-full rounded-lg border p-3'}
    >
      <div className={'flex min-w-0 flex-col gap-0.5 pb-2.5'}>
        <div className={'type-body-sm text-ink truncate font-semibold'}>
          {formatUserName(
            userData.name,
            userData.firstName,
            userData.lastName,
            userData.isForeigner
          )}
        </div>
        <div className={'type-eyebrow text-ink-muted truncate font-normal'}>
          {session?.user?.email}
        </div>
        <div className={'pt-1'}>
          <span className={'admin-badge-primary'}>{userData.role}</span>
        </div>
      </div>
      <SignOutButton
        className={'admin-btn-secondary type-eyebrow min-h-9 w-full px-3'}
        spinnerClassName={'size-4 border-2 border-t-current border-current/30'}
        label={t.signOut}
      />
    </motion.div>
  )
}

export default function UserAuthControlPanel() {
  return (
    <Suspense fallback={<AdminCardSkeleton className={'h-[124px]'} />}>
      <UserProfile />
    </Suspense>
  )
}
