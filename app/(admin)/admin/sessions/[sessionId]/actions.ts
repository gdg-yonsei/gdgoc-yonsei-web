'use server'

import { forbidden, redirect } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import db from '@/db'
import { sessions } from '@/db/schema/sessions'
import { userToSession } from '@/db/schema/user-to-session'
import { requirePermission } from '@/lib/server/permission/require-permission'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import { isUuid } from '@/lib/server/queries/public/uuid'
import { sessionWallClockNow } from '@/lib/site/datetime'

/**
 * 참가자 본인이 세션 등록을 취소한다.
 * 세션이 이미 끝난 뒤에는 이력을 지울 수 없다.
 */
export async function unregisterSessionAction(sessionId: string) {
  const session = await requirePermission('get', 'sessionsPage')
  if (!session?.user?.id || !isUuid(sessionId)) {
    return forbidden()
  }

  const sessionData = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    columns: { endAt: true },
  })
  if (!sessionData) {
    return forbidden()
  }

  // endAt 은 Seoul 벽시계를 UTC 라벨로 저장한 값이다.
  if (
    sessionData.endAt !== null &&
    sessionData.endAt <= sessionWallClockNow()
  ) {
    return forbidden()
  }

  await db
    .delete(userToSession)
    .where(
      and(
        eq(userToSession.sessionId, sessionId),
        eq(userToSession.userId, session.user.id)
      )
    )

  return redirect(await getLocalizedAdminPath(`/admin/sessions/${sessionId}`))
}

/**
 * 세션 작성자·코어 이상이 특정 참가자를 명단에서 제거한다.
 */
export async function removeParticipantAction(
  sessionId: string,
  userId: string
) {
  // users.id 는 Better Auth 가 발급하는 임의 문자열이라 UUID 가 아닐 수 있다.
  // 삭제는 (sessionId, userId) 복합키에 한정되므로 형식 검증은 sessionId 만 한다.
  if (!isUuid(sessionId) || !userId) {
    return forbidden()
  }

  const sessionData = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    columns: { authorId: true },
  })
  if (!sessionData) {
    return forbidden()
  }

  // 세션 작성자 또는 sessions 수정 권한자만 참가자를 제거할 수 있다.
  await requirePermission('put', 'sessions', sessionData.authorId)

  await db
    .delete(userToSession)
    .where(
      and(
        eq(userToSession.sessionId, sessionId),
        eq(userToSession.userId, userId)
      )
    )

  return redirect(await getLocalizedAdminPath(`/admin/sessions/${sessionId}`))
}
