import { auth } from '@/auth'
import { forbidden } from 'next/navigation'
import RegisterSessionCard from '@/app/(admin)/admin/sessions/registerSessionCard'
import getNotEnrolledSessions from '@/app/(admin)/admin/sessions/getNotEnrolledSessions'

export default async function RegisterSession() {
  const session = await auth()
  if (!session || !session.user?.id) {
    return forbidden()
  }

  const notEnrolledSessions = await getNotEnrolledSessions(session.user.id)

  return (
    <div className={'pb-8'}>
      <div className={'admin-title'}>Join a Session</div>
      <div className={'member-data-grid w-full gap-2 pt-2'}>
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
          />
        ))}
        {notEnrolledSessions.length === 0 && (
          <div className={'col-span-2'}>
            <p className={'text-neutral-800'}>No sessions available to join.</p>
          </div>
        )}
      </div>
    </div>
  )
}
