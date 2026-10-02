/**
 * "참여 중인 다가오는 세션" 섹션(서버 컴포넌트). 관리자 홈과 세션 화면이 함께 쓴다.
 */
import { getAuthSession } from '@/auth'
import { forbidden } from 'next/navigation'
import SessionCard from '@/app/(admin)/admin/sessions/session-card'
import AdminEmptyState from '@/app/components/admin/empty-state'
import { getUserUpcomingSessions } from '@/lib/server/fetcher/admin/get-upcoming-sessions'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'

/** 내가 신청한 세션 중 아직 시작하지 않은 것을 시작 순으로 보여 준다. */
export default async function UpcomingSessions() {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  const session = await getAuthSession()
  if (!session || !session.user?.id) {
    return forbidden()
  }

  const enrolledSessions = await getUserUpcomingSessions(session.user.id)

  return (
    <section className={'flex flex-col gap-3'}>
      <h2 className={'type-heading-3 text-ink'}>{t.upcomingSessions}</h2>
      {enrolledSessions.length === 0 ? (
        <AdminEmptyState title={t.noResults} />
      ) : (
        <div className={'admin-form-grid w-full'}>
          {enrolledSessions.map((session) => (
            <SessionCard key={session.id} session={session} locale={locale} />
          ))}
        </div>
      )}
    </section>
  )
}
