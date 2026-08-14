'use server'

import { getAuthSession } from '@/auth'
import { getMember } from '@/lib/server/fetcher/admin/get-member'
import db from '@/db'
import { users } from '@/db/schema/users'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import { logger } from '@/lib/server/logger'

export async function toggleSessionNotificationEmailAction(
  _formData: FormData
) {
  void _formData
  const session = await getAuthSession()

  if (!session?.user?.id) {
    return redirect(await getLocalizedAdminPath('/admin/profile'))
  }

  const userData = await getMember(session.user.id)
  if (!userData) {
    return redirect(await getLocalizedAdminPath('/admin/profile'))
  }

  try {
    await db
      .update(users)
      .set({
        sessionNotiEmail: !userData.sessionNotiEmail,
      })
      .where(eq(users.id, session.user.id))
  } catch (error) {
    logger.error('admin.profile.toggle-session-notification', error, {
      userId: session.user.id,
    })
  }

  redirect(await getLocalizedAdminPath('/admin/profile'))
}
