import { getAuthSession } from '@/auth'
import { forbidden } from 'next/navigation'
import RegisterSessionCard from '@/app/(admin)/admin/sessions/register-session-card'
import getUnenrolledUpcomingSessions from '@/app/(admin)/admin/sessions/get-not-enrolled-sessions'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'

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
