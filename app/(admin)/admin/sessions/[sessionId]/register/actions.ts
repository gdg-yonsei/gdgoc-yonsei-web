'use server'

import { forbidden, redirect } from 'next/navigation'
import { requirePermission } from '@/lib/server/permission/require-permission'
import db from '@/db'
import { eq, sql } from 'drizzle-orm'
import { sessions } from '@/db/schema/sessions'
import { userToSession } from '@/db/schema/user-to-session'
import { Resend } from 'resend'
import { users } from '@/db/schema/users'
import NewParticipant from '@/emails/new-participant'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import { getResendEnv } from '@/lib/server/env'
import { logger } from '@/lib/server/logger'
import { isUuid } from '@/lib/server/queries/public/uuid'
import { sessionWallClockNow } from '@/lib/site/datetime'

class SessionFullError extends Error {}

export async function registerSessionAction(
  sessionId: string,
  _prevState: { error: string },
  _formData: FormData
) {
  void _prevState
  void _formData

  if (!isUuid(sessionId)) {
    return { error: 'Session not found' }
  }

  // 사용자가 session에 등록할 권한이 있는지 확인
  const session = await requirePermission('get', 'sessionsPage')
  if (!session?.user?.id) {
    return forbidden()
  }

  // check internal open or public open session
  const sessionData = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    with: {
      author: true,
      userToSession: true,
    },
  })

  // endAt 은 Seoul 벽시계를 UTC 라벨로 저장한 값이다.
  if (
    !sessionData ||
    !(sessionData.internalOpen || sessionData.publicOpen) ||
    (sessionData.endAt !== null && sessionData.endAt <= sessionWallClockNow())
  ) {
    return forbidden()
  }

  if (
    sessionData.userToSession.some(
      (participant) => participant.userId === session.user.id
    )
  ) {
    return {
      error: 'Already registered',
    }
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
        userId: session.user?.id as string,
        sessionId: sessionId,
      })
    })
  } catch (e) {
    if (e instanceof SessionFullError) {
      return { error: 'Session is full' }
    }
    logger.error('admin.sessions.register', e, {
      sessionId,
      userId: session.user.id,
    })
    return { error: 'Registration failed' }
  }

  // 알림 메일은 트랜잭션 커밋 뒤에 보낸다 — 트랜잭션 안에서 외부 API 를
  // 호출하면 메일 지연이 잠금을 붙잡고, 실패 시 등록이 롤백된다.
  if (sessionData.author?.email) {
    try {
      const userData = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
      })
      const resend = new Resend(getResendEnv().RESEND_API_KEY)
      await resend.emails.send({
        from: 'GDGoC Yonsei <gdgoc.yonsei@moveto.kr>',
        to: sessionData.author.email,
        subject: `[GDGoC Yonsei] 새로운 참가자가 등록했습니다.`,
        react: NewParticipant({
          session: {
            name: sessionData.nameKo,
            location: sessionData.locationKo!,
            startAt: sessionData.startAt
              ? sessionData.startAt?.toISOString()
              : 'TBD',
            endAt: sessionData.endAt ? sessionData.endAt?.toISOString() : 'TBD',
            leftCapacity: sessionData.maxCapacity
              ? sessionData.maxCapacity - sessionData.userToSession.length - 1
              : 0,
          },
          participantName: userData?.name ? userData?.name : '',
        }),
      })
    } catch (e) {
      // 등록은 이미 성공 — 메일 실패는 로깅만 한다.
      logger.error('admin.sessions.register.email', e, {
        sessionId,
        userId: session.user.id,
      })
    }
  }

  return redirect(await getLocalizedAdminPath(`/admin/sessions/${sessionId}`))
}
