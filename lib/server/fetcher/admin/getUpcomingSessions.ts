import db from '@/db'
import { sessions } from '@/db/schema/sessions'
import { userToSession } from '@/db/schema/user-to-session'
import { and, asc, eq, gte } from 'drizzle-orm'
import cacheTagT from '@/lib/server/cacheTagT'

export default async function getUpcomingSessions(userId: string) {
  'use cache'
  cacheTagT('sessions')

  return db
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
      internalOpen: sessions.internalOpen,
      publicOpen: sessions.publicOpen,
      partId: sessions.partId,
      mainImage: sessions.mainImage,
      images: sessions.images,
      type: sessions.type,
      displayOnWebsite: sessions.displayOnWebsite,
    })
    .from(userToSession)
    .innerJoin(sessions, eq(userToSession.sessionId, sessions.id))
    .where(
      and(eq(userToSession.userId, userId), gte(sessions.startAt, new Date()))
    )
    .orderBy(asc(sessions.startAt))
}
