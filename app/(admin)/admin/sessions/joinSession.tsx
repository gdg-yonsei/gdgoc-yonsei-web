import { auth } from '@/auth'
import { forbidden } from 'next/navigation'
import db from '@/db'
import { sessions } from '@/db/schema/sessions'
import { userToSession } from '@/db/schema/user-to-session'
import { and, asc, eq, ne } from 'drizzle-orm'
import SessionCard from '@/app/(admin)/admin/sessions/sessionCard'

export default async function JoinSession() {
  const session = await auth()
  if (!session || !session.user?.id) {
    return forbidden()
  }

  const notEnrolledSessions = await db
    .selectDistinct({
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
      internalOpen: sessions.internalOpen,
      publicOpen: sessions.publicOpen,
      partId: sessions.partId,
      mainImage: sessions.mainImage,
      images: sessions.images,
    })
    .from(userToSession)
    .innerJoin(sessions, eq(userToSession.sessionId, sessions.id))
    .where(and(ne(userToSession.userId, session.user.id)))
    .orderBy(asc(sessions.startAt))

  return (
    <div className={'pb-8'}>
      <div className={'admin-title'}>Join Session</div>
      <div className={'member-data-grid w-full gap-2 pt-2'}>
        {notEnrolledSessions.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>
    </div>
  )
}
