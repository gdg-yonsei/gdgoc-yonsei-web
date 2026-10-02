/**
 * 내가 아직 신청하지 않은, 신청 가능한 다가오는 세션 조회(관리자 세션 화면의 "참여할 세션").
 *
 * 캐시하지 않는 관리자 조회다(사용자마다 결과가 다르다).
 */
import 'server-only'

import { db } from '@/db'
import { userToSession } from '@/db/schema/user-to-session'
import { and, asc, eq, gt, isNull, sql } from 'drizzle-orm'
import { sessions } from '@/db/schema/sessions'
import { parts } from '@/db/schema/parts'
import { sessionWallClockNow } from '@/lib/format/datetime'

/**
 * 멤버 신청이 열려 있고(`internalOpen`) 아직 시작하지 않았으며, 사용자가 신청하지 않은 세션을
 * 시작 순으로 읽는다. 세션마다 현재 신청자 수(`participantCount`)를 함께 센다.
 * @param userId 로그인 사용자 id
 */
export async function getUnenrolledUpcomingSessions(userId: string) {
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

  // startAt은 서울 벽시계 시각을 UTC 라벨로 저장한 값이라 비교 기준도 같은 방식으로 만든다.
  const now = sessionWallClockNow()

  return db
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
        eq(userToSession.userId, userId)
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
}
