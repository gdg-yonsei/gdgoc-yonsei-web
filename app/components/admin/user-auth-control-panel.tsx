import { Suspense } from 'react'
import { getAuthSession } from '@/auth'
import { SignOutButton } from '@/app/components/auth/sign-out-button'
import * as motion from 'motion/react-client'
import formatUserName from '@/lib/format-user-name'
import { notFound } from 'next/navigation'
import { getMember } from '@/lib/server/fetcher/admin/get-member'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'

/**
 * 사용자 정보 표시 패널
 * @constructor
 */
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
            'border-hairline bg-surface-sunken h-[124px] w-full animate-pulse rounded-lg border'
          }
        />
      }
    >
      <UserProfile />
    </Suspense>
  )
}
