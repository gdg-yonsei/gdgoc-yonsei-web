'use server'

import { auth } from '@/auth'
import { forbidden, redirect } from 'next/navigation'
import handlePermission from '@/lib/server/permission/handle-permission'
import db from '@/db'
import { and, eq } from 'drizzle-orm'
import { sessions } from '@/db/schema/sessions'
import { userToSession } from '@/db/schema/user-to-session'
import { Resend } from 'resend'
import { users } from '@/db/schema/users'
import NewParticipant from '@/emails/new-participant'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import { getResendEnv } from '@/lib/server/env'
import { logger } from '@/lib/server/logger'

/**
 * `registerSessionAction` 함수는 전달받은 입력값을 바탕으로 필요한 비즈니스 로직을 수행합니다.
 *
 * 구동 원리:
 * 1. 입력값(없음)을 기준으로 전처리/검증 또는 조회 조건을 구성합니다.
 * 2. 함수 본문의 조건 분기와 동기/비동기 로직을 순서대로 실행합니다.
 * 3. 계산 결과를 반환하거나 캐시/DB/리다이렉트 등 필요한 부수 효과를 반영합니다.
 *
 * 작동 결과:
 * - 호출부에서 즉시 활용 가능한 결과값 또는 실행 상태를 제공합니다.
 * - 후속 로직이 안정적으로 이어질 수 있도록 일관된 동작을 보장합니다.
 */
export async function registerSessionAction(
  sessionId: string,
  _prevState: { error: string },
  _formData: FormData
) {
  void _prevState
  void _formData
  const session = await auth()

  // 사용자가 session에 등록할 권한이 있는지 확인
  if (
    !session?.user?.id ||
    !(await handlePermission(session.user.id, 'get', 'sessionsPage'))
  ) {
    return forbidden()
  }

  // check internal open or public open session
  const sessionData = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
  })

  if (!sessionData || !(sessionData.internalOpen || sessionData.publicOpen)) {
    return forbidden()
  }

  const checkAlreadyRegistered = await db.query.userToSession.findFirst({
    where: and(
      eq(userToSession.sessionId, sessionId),
      eq(userToSession.userId, session.user.id)
    ),
  })

  if (checkAlreadyRegistered) {
    return {
      error: 'Already registered',
    }
  }

  try {
    await db.transaction(async (tx) => {
      const sessionData = await tx.query.sessions.findFirst({
        where: eq(sessions.id, sessionId),
        with: {
          userToSession: true,
          author: true,
        },
      })
      if (
        !sessionData?.maxCapacity ||
        sessionData.maxCapacity <= sessionData.userToSession.length
      ) {
        tx.rollback()
      }
      await tx.insert(userToSession).values({
        userId: session.user?.id as string,
        sessionId: sessionId,
      })
      if (sessionData?.author.email && session?.user?.id) {
        const userData = await db.query.users.findFirst({
          where: eq(users.id, session.user?.id),
        })
        const resend = new Resend(getResendEnv().RESEND_API_KEY)
        await resend.emails.send({
          from: 'GDGoC Yonsei <gdgoc.yonsei@moveto.kr>',
          to: sessionData?.author.email,
          subject: `[GDGoC Yonsei] 새로운 참가자가 등록했습니다.`,
          react: NewParticipant({
            session: {
              name: sessionData.nameKo,
              location: sessionData.locationKo!,
              startAt: sessionData.startAt
                ? sessionData.startAt?.toISOString()
                : 'TBD',
              endAt: sessionData.endAt
                ? sessionData.endAt?.toISOString()
                : 'TBD',
              leftCapacity: sessionData.maxCapacity
                ? sessionData.maxCapacity - sessionData.userToSession.length - 1
                : 0,
            },
            participantName: userData?.name ? userData?.name : '',
          }),
        })
      }
    })
  } catch (e) {
    logger.error('admin.sessions.register', e, {
      sessionId,
      userId: session.user.id,
    })
    return { error: 'Overcapacity' }
  }

  return redirect(
    await getLocalizedAdminPath(`/admin/sessions/${sessionId}`)
  )
}
