'use server'

import { auth } from '@/auth'
import { getMember } from '@/lib/server/fetcher/admin/get-member'
import db from '@/db'
import { users } from '@/db/schema/users'
import { eq } from 'drizzle-orm'
import revalidateAllDataAction from '@/app/components/admin/refresh-all-data-button/actions'

export async function changeSubscribeSessionNotiEmail(formData: FormData) {
  const session = await auth()

  if (!session?.user?.id) {
    return revalidateAllDataAction()
  }

  const userData = await getMember(session.user.id)

  await db
    .update(users)
    .set({
      sessionNotiEmail: !userData.sessionNotiEmail,
    })
    .where(eq(users.id, session.user.id))

  await revalidateAllDataAction()
}
