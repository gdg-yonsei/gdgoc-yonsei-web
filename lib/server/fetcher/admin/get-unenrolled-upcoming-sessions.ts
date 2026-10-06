// 사용자마다 달라 신청 가능한 세션 조회는 공유 캐시하지 않는다.
import 'server-only'

import { db } from '@/db'
import { userToSession } from '@/db/schema/user-to-session'
import { and, asc, eq, gt, isNull, sql } from 'drizzle-orm'
import { sessions } from '@/db/schema/sessions'
import { parts } from '@/db/schema/parts'
import { sessionWallClockNow } from '@/lib/format/datetime'

// internalOpen인 미시작·미신청 세션을 시작순으로 읽고 신청자 수를 센다. 카드용 필드만 공개한다.
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
      name: sessions.name,
      nameKo: sessions.nameKo,
      startAt: sessions.startAt,
      endAt: sessions.endAt,
      maxCapacity: sessions.maxCapacity,
      part: parts.name,
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
