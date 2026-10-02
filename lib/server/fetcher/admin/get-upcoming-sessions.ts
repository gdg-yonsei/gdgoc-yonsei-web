/**
 * 내가 신청한 다가오는 세션 조회(관리자 프로필 화면).
 *
 * 캐시하지 않는 관리자 조회다(권한·기수 범위에 따라 결과가 달라 공유 캐시를 쓰지 않는다).
 * 권한 확인은 호출부(레이아웃 가드, 서비스)가 먼저 한다.
 */
import 'server-only'

import { db } from '@/db'
import { sessions } from '@/db/schema/sessions'
import { userToSession } from '@/db/schema/user-to-session'
import { and, asc, eq, gte } from 'drizzle-orm'
import { sessionWallClockNow } from '@/lib/format/datetime'

/** 사용자가 참가 신청한 세션 중 아직 시작하지 않은 것을 시작 순으로 읽는다. */
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
