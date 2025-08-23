import { auth } from '@/auth'
import { forbidden } from 'next/navigation'
import SessionCard from '@/app/(admin)/admin/sessions/sessionCard'
import getUpcomingSessions from '@/lib/server/fetcher/admin/getUpcomingSessions'

export default async function UpcomingSessions() {
  const session = await auth()
  if (!session || !session.user?.id) {
    return forbidden()
  }

  const enrolledSessions = await getUpcomingSessions(session.user.id)

  return (
    <div className={'pb-8'}>
      <h2 className={'admin-title'}>Upcoming Sessions</h2>
      <div className={'member-data-grid w-full gap-2 pt-2'}>
        {enrolledSessions.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>
    </div>
  )
}
