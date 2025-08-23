import { auth } from '@/auth'
import { forbidden } from 'next/navigation'
import db from '@/db'
import { sessions } from '@/db/schema/sessions'
import { userToSession } from '@/db/schema/user-to-session'
import { and, asc, eq, gt, isNull, sql } from 'drizzle-orm'
import RegisterSessionCard from '@/app/(admin)/admin/sessions/registerSessionCard'
import { parts } from '@/db/schema/parts'

export default async function RegisterSession() {
  const session = await auth()
  if (!session || !session.user?.id) {
    return forbidden()
  }

  const participantsSub = db
    .select({
      sessionId: userToSession.sessionId,
      participantCount: sql<number>`COUNT(${userToSession.userId})`.as(
        'participantCount'
      ),
    })
    .from(userToSession)
    .groupBy(userToSession.sessionId)
    .as('participants')

  const now = new Date()

  const notEnrolledSessions = await db
    .select({
      id: sessions.id,
      name: sessions.nameKo,
      startAt: sessions.startAt,
      endAt: sessions.endAt,
      location: sessions.locationKo,
      maxCapacity: sessions.maxCapacity,
      partId: sessions.partId,
      part: parts.name,
      mainImage: sessions.mainImage,
      images: sessions.images,
      participantCount: participantsSub.participantCount,
    })
    .from(sessions)
    .innerJoin(parts, eq(sessions.partId, parts.id))
    .leftJoin(participantsSub, eq(sessions.id, participantsSub.sessionId))
    .leftJoin(
      userToSession,
      and(
        eq(userToSession.sessionId, sessions.id),
        eq(userToSession.userId, session.user.id)
      )
    )
    .where(
      and(
        eq(sessions.internalOpen, true),
        gt(sessions.startAt, now),
        isNull(userToSession.userId)
      )
    )
    .orderBy(asc(sessions.startAt))

  return (
    <div className={'pb-8'}>
      <div className={'admin-title'}>Register Session</div>
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
      </div>
    </div>
  )
}
