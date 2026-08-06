'use server'

import { forbidden, redirect } from 'next/navigation'
import { requirePermission } from '@/lib/server/permission/require-permission'
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

export async function registerSessionAction(
  sessionId: string,
  _prevState: { error: string },
  _formData: FormData
) {
  void _prevState
  void _formData
  // 사용자가 session에 등록할 권한이 있는지 확인
  const session = await requirePermission('get', 'sessionsPage')
  if (!session?.user?.id) {
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

  return redirect(await getLocalizedAdminPath(`/admin/sessions/${sessionId}`))
}
