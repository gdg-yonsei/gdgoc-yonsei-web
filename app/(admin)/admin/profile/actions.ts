'use server'

import { redirect } from 'next/navigation'
import { getMember } from '@/lib/server/fetcher/admin/get-member'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import { setSessionNotificationEmail } from '@/lib/server/services/admin/profile'
import { getWebActor } from '@/lib/server/services/admin/web-actor'

/** 폼 액션 서명 때문에 FormData를 받지만 쓰지 않으며, 로그인하지 않았으면 설정을 바꾸지 않는다. */
export async function toggleSessionNotificationEmailAction(
  _formData: FormData
) {
  void _formData
  const actor = await getWebActor()

  if (!actor) {
    return redirect(await getLocalizedAdminPath('/admin/profile'))
  }

  const userData = await getMember(actor.userId)
  if (userData) {
    await setSessionNotificationEmail(actor, !userData.sessionNotiEmail)
  }

  redirect(await getLocalizedAdminPath('/admin/profile'))
}
