/**
 * 세션 화면의 "참여할 세션" 섹션(서버 컴포넌트).
 */
import { getAuthSession } from '@/auth'
import { forbidden } from 'next/navigation'
import RegisterSessionCard from '@/app/(admin)/admin/sessions/register-session-card'
import { getUnenrolledUpcomingSessions } from '@/lib/server/fetcher/admin/get-unenrolled-upcoming-sessions'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'

/** 내가 아직 신청하지 않은, 신청 가능한 다가오는 세션 카드 목록. */
export default async function RegisterSession() {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  const session = await getAuthSession()
  if (!session || !session.user?.id) {
    return forbidden()
  }

  const notEnrolledSessions = await getUnenrolledUpcomingSessions(
    session.user.id
  )

  return (
    <section className={'flex flex-col gap-3'}>
      <h2 className={'type-heading-3 text-ink'}>{t.joinSession}</h2>
      <div className={'admin-form-grid w-full'}>
        {notEnrolledSessions.map((session) => (
          <RegisterSessionCard
            key={session.id}
            sessionId={session.id}
            sessionName={session.name}
            sessionNameKo={session.nameKo}
            part={session.part}
            startAt={session.startAt}
            endAt={session.endAt}
            participants={session.participantCount}
            maxCapacity={session.maxCapacity}
            locale={locale}
          />
        ))}
        {notEnrolledSessions.length === 0 && (
          <p
            className={'admin-form-grid-full type-body-sm text-ink-muted py-2'}
          >
            {t.noSessionsToJoin}
          </p>
        )}
      </div>
    </section>
  )
}
