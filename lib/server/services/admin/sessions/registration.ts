/**
 * 세션 참가 신청 서비스: 신청, 본인 취소, 운영진의 참가자 제거.
 *
 * 정원 초과를 막기 위해 신청은 세션 행을 잠그는 트랜잭션 안에서 처리한다.
 */
import 'server-only'

import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { sessions } from '@/db/schema/sessions'
import { userToSession } from '@/db/schema/user-to-session'
import { runAfterResponse } from '@/lib/server/after-response'
import { logger } from '@/lib/server/logger'
import { isUuid } from '@/lib/server/queries/public/uuid'
import {
  authorize,
  canAccessGeneration,
  hasScope,
} from '@/lib/server/services/admin/authorize'
import {
  fail,
  ok,
  type Actor,
  type ServiceResult,
} from '@/lib/server/services/admin/types'
import { sessionWallClockNow } from '@/lib/format/datetime'
import { sendNewParticipantEmail } from '@/lib/server/services/admin/sessions/notifications'
import { NOT_FOUND } from '@/lib/server/services/admin/sessions/shared'

class SessionFullError extends Error {}

export async function registerForSession(
  actor: Actor,
  sessionId: string
): Promise<ServiceResult<{ sessionId: string }>> {
  if (!isUuid(sessionId)) return fail('NOT_FOUND', NOT_FOUND)

  // 사용자가 session에 등록할 권한이 있는지 확인
  // 신청·취소는 쓰기다. 권한 매트릭스는 조회 권한으로 판단하므로 스코프를 따로 본다.
  if (!hasScope(actor, 'gyms:write')) {
    return fail('FORBIDDEN', 'The access token does not grant this operation.')
  }
  const authorization = authorize(actor, 'get', 'sessionsPage')
  if (!authorization.ok) return authorization

  const sessionData = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    with: {
      author: true,
      userToSession: true,
    },
  })

  if (!sessionData) return fail('NOT_FOUND', NOT_FOUND)

  // endAt 은 Seoul 벽시계를 UTC 라벨로 저장한 값이다.
  if (
    !(sessionData.internalOpen || sessionData.publicOpen) ||
    (sessionData.endAt !== null && sessionData.endAt <= sessionWallClockNow())
  ) {
    return fail('FORBIDDEN', 'This session is not open for registration.')
  }

  if (
    sessionData.userToSession.some(
      (participant) => participant.userId === actor.userId
    )
  ) {
    return fail('CONFLICT', 'Already registered')
  }

  // 세션 행을 잠가 동시 등록이 maxCapacity 를 초과하지 않도록 한다.
  try {
    await db.transaction(async (tx) => {
      const locked = await tx
        .select({ maxCapacity: sessions.maxCapacity })
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .for('update')

      const countRows = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(userToSession)
        .where(eq(userToSession.sessionId, sessionId))

      const maxCapacity = locked[0]?.maxCapacity ?? 0
      const count = countRows[0]?.count ?? 0
      if (maxCapacity <= count) {
        throw new SessionFullError()
      }

      await tx.insert(userToSession).values({
        userId: actor.userId,
        sessionId: sessionId,
      })
    })
  } catch (e) {
    if (e instanceof SessionFullError) {
      return fail('CONFLICT', 'Session is full')
    }
    logger.error('admin.sessions.register', e, {
      sessionId,
      userId: actor.userId,
    })
    return fail('INTERNAL', 'Registration failed')
  }

  // 알림 메일은 트랜잭션 커밋 뒤, 응답을 보낸 다음에 보낸다. 트랜잭션 안에서 외부
  // API를 호출하면 메일 지연이 잠금을 붙잡고, 실패 시 등록까지 롤백되기 때문이다.
  const authorEmail = sessionData.author?.email
  if (authorEmail) {
    runAfterResponse(
      'admin.sessions.register.email',
      () =>
        sendNewParticipantEmail({
          authorEmail,
          participantId: actor.userId,
          session: sessionData,
        }),
      { sessionId, userId: actor.userId }
    )
  }

  return ok({ sessionId })
}

/**
 * 참가자 본인이 세션 등록을 취소한다.
 * 세션이 이미 끝난 뒤에는 이력을 지울 수 없다.
 */
export async function unregisterFromSession(
  actor: Actor,
  sessionId: string
): Promise<ServiceResult<{ sessionId: string }>> {
  // 신청·취소는 쓰기다. 권한 매트릭스는 조회 권한으로 판단하므로 스코프를 따로 본다.
  if (!hasScope(actor, 'gyms:write')) {
    return fail('FORBIDDEN', 'The access token does not grant this operation.')
  }
  const authorization = authorize(actor, 'get', 'sessionsPage')
  if (!authorization.ok) return authorization
  if (!isUuid(sessionId)) return fail('NOT_FOUND', NOT_FOUND)

  const sessionData = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    columns: { endAt: true },
  })
  if (!sessionData) return fail('NOT_FOUND', NOT_FOUND)

  // endAt 은 Seoul 벽시계를 UTC 라벨로 저장한 값이다.
  if (
    sessionData.endAt !== null &&
    sessionData.endAt <= sessionWallClockNow()
  ) {
    return fail('FORBIDDEN', 'The session has already ended.')
  }

  await db
    .delete(userToSession)
    .where(
      and(
        eq(userToSession.sessionId, sessionId),
        eq(userToSession.userId, actor.userId)
      )
    )

  return ok({ sessionId })
}

/**
 * 세션 작성자·코어 이상이 특정 참가자를 명단에서 제거한다.
 */
export async function removeSessionParticipant(
  actor: Actor,
  sessionId: string,
  userId: string
): Promise<ServiceResult<{ sessionId: string; userId: string }>> {
  // users.id 는 Better Auth 가 발급하는 임의 문자열이라 UUID 가 아닐 수 있다.
  // 삭제는 (sessionId, userId) 복합키에 한정되므로 형식 검증은 sessionId 만 한다.
  if (!isUuid(sessionId) || !userId) return fail('NOT_FOUND', NOT_FOUND)

  const sessionData = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    columns: { authorId: true },
    with: { part: { columns: { generationsId: true } } },
  })
  if (!sessionData) return fail('NOT_FOUND', NOT_FOUND)

  // 세션 작성자 또는 sessions 수정 권한자만 참가자를 제거할 수 있다.
  const authorization = authorize(
    actor,
    'put',
    'sessions',
    sessionData.authorId
  )
  if (!authorization.ok) return authorization

  if (
    sessionData.authorId !== actor.userId &&
    !(await canAccessGeneration(actor, sessionData.part?.generationsId))
  ) {
    return fail('FORBIDDEN', 'You cannot manage sessions of this generation.')
  }

  await db
    .delete(userToSession)
    .where(
      and(
        eq(userToSession.sessionId, sessionId),
        eq(userToSession.userId, userId)
      )
    )

  return ok({ sessionId, userId })
}
