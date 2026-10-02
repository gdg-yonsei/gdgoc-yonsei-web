'use server'

/**
 * 내 프로필의 세션 알림 메일 수신 설정 Server Action.
 */
import { redirect } from 'next/navigation'
import { getMember } from '@/lib/server/fetcher/admin/get-member'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import { setSessionNotificationEmail } from '@/lib/server/services/admin/profile'
import { getWebActor } from '@/lib/server/services/admin/web-actor'

/**
 * 세션 알림 메일 수신 여부를 반대로 바꾸고 프로필 화면으로 돌아간다.
 *
 * 폼 제출로 호출되므로 FormData를 받지만 쓰지 않는다. 로그인하지 않았으면 바꾸지 않는다.
 */
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
