import { auth } from '@/auth'
import { forbidden } from 'next/navigation'
import db from '@/db'
import { and, eq } from 'drizzle-orm'
import { userToSession } from '@/db/schema/user-to-session'
import { sessions } from '@/db/schema/sessions'

export default async function UpcomingSessions() {
  const session = await auth()
  if (!session || !session.user?.id) {
    return forbidden()
  }

  const enrolledSessions = await db
    .select({
      id: sessions.id,
      name: sessions.name,
      nameKo: sessions.nameKo,
      description: sessions.description,
      descriptionKo: sessions.descriptionKo,
      startAt: sessions.startAt,
      endAt: sessions.endAt,
      location: sessions.location,
      locationKo: sessions.locationKo,
      maxCapacity: sessions.maxCapacity,
      authorId: sessions.authorId,
      createdAt: sessions.createdAt,
      updatedAt: sessions.updatedAt,
    })
    .from(userToSession)
    .innerJoin(sessions, eq(userToSession.sessionId, sessions.id))
    .where(and(eq(userToSession.userId, session.user.id)))

  console.log(enrolledSessions)

  return (
    <div>
      <h2 className={'admin-title'}>Upcoming Sessions</h2>
    </div>
  )
}
