/**
 * 세션 알림 메일 구독/해지 토글 버튼(서버 컴포넌트).
 */
import { getAuthSession } from '@/auth'
import { notFound } from 'next/navigation'
import { getMember } from '@/lib/server/fetcher/admin/get-member'
import { toggleSessionNotificationEmailAction } from '@/app/(admin)/admin/profile/actions'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'
import { cn } from '@/lib/cn'

/** 현재 수신 여부에 따라 "구독" 또는 "해지" 버튼을 보여 준다. */
export default async function UnsubscribeSessionNotiEmailPage() {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  const session = await getAuthSession()

  if (!session?.user?.id) {
    notFound()
  }

  const userData = await getMember(session.user.id)
  if (!userData) {
    notFound()
  }

  return (
    <form
      className={'flex w-full items-center justify-center'}
      action={toggleSessionNotificationEmailAction}
    >
      <button
        className={cn(
          'rounded-full border-2 p-2 px-4 text-sm transition-colors',
          userData.sessionNotiEmail
            ? 'border-danger bg-danger-soft text-danger hover:bg-danger-soft'
            : 'border-success bg-success-soft text-success hover:bg-success-soft'
        )}
      >
        {userData.sessionNotiEmail ? t.unsubscribe : t.subscribe}{' '}
        {t.sessionNotificationEmails}
      </button>
    </form>
  )
}
