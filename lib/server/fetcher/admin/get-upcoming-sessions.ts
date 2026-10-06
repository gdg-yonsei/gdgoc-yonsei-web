// 권한·기수별 조회는 공유 캐시하지 않는다. 호출부가 권한을 먼저 확인해야 한다.
import 'server-only'

import { db } from '@/db'
import { sessions } from '@/db/schema/sessions'
import { userToSession } from '@/db/schema/user-to-session'
import { and, asc, eq, gte } from 'drizzle-orm'
import { sessionWallClockNow } from '@/lib/format/datetime'

export async function getUserUpcomingSessions(userId: string) {
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
      and(
        eq(userToSession.userId, userId),
        // startAt 은 Seoul 벽시계를 UTC 라벨로 저장한 값이다.
        gte(sessions.startAt, sessionWallClockNow())
      )
    )
    .orderBy(asc(sessions.startAt))
}
