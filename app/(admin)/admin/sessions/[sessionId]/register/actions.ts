'use server'
import { auth } from '@/auth'
import { forbidden, redirect } from 'next/navigation'
import handlePermission from '@/lib/server/permission/handle-permission'
import db from '@/db'
import { and, eq } from 'drizzle-orm'
import { sessions } from '@/db/schema/sessions'
import { userToSession } from '@/db/schema/user-to-session'
import { revalidateTag } from 'next/cache'
import { Resend } from 'resend'
import { users } from '@/db/schema/users'
import NewParticipant from '@/emails/new-participant'

export async function registerSessionAction(
  sessionId: string,
  prevState: { error: string },
  formData: FormData
) {
  const session = await auth()

  // 사용자가 session에 등록할 권한이 있는지 확인
  if (
    !session?.user?.id ||
    !(await handlePermission(session.user.id, 'get', 'sessionsPage'))
  ) {
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
        const resend = new Resend(process.env.RESEND_API_KEY)
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
    console.error(e)
    revalidateTag('sessions')
    return { error: 'Overcapacity' }
  }

  revalidateTag('sessions')

  return redirect(`/admin/sessions/${sessionId}`)
}
