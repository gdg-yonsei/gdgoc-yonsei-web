'use server'
import { auth } from '@/auth'
import { forbidden, redirect } from 'next/navigation'
import handlePermission from '@/lib/server/permission/handle-permission'
import db from '@/db'
import { and, eq } from 'drizzle-orm'
import { sessions } from '@/db/schema/sessions'
import { userToSession } from '@/db/schema/user-to-session'
import { revalidateTag } from 'next/cache'

export async function registerSessionAction(
  sessionId: string,
  prev: { error: string },
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
    })
  } catch (e) {
    console.error(e)
    revalidateTag('sessions')
    return { error: 'Overcapacity' }
  }

  revalidateTag('sessions')

  return redirect(`/admin/sessions/${sessionId}`)
}
