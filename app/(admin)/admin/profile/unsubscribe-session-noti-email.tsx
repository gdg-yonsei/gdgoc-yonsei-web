import { auth } from '@/auth'
import { notFound } from 'next/navigation'
import { getMember } from '@/lib/server/fetcher/admin/get-member'
import { toggleSessionNotificationEmailAction } from '@/app/(admin)/admin/profile/actions'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'

/**
 * `UnsubscribeSessionNotiEmailPage` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(없음)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
export default async function UnsubscribeSessionNotiEmailPage() {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  const session = await auth()

  if (!session?.user?.id) {
    notFound()
  }

  const userData = await getMember(session.user.id)

  return (
    <form
      className={'flex w-full items-center justify-center'}
      action={toggleSessionNotificationEmailAction}
    >
      <button
        className={`rounded-full border-2 ${userData.sessionNotiEmail ? 'border-red-500 bg-red-50 text-red-800 hover:bg-red-200' : 'border-green-500 bg-green-50 text-green-800 hover:bg-green-200'} p-2 px-4 text-sm transition-colors`}
      >
        {userData.sessionNotiEmail ? t.unsubscribe : t.subscribe}{' '}
        {t.sessionNotificationEmails}
      </button>
    </form>
  )
}
