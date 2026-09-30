'use server'

import { forbidden, redirect } from 'next/navigation'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import { registerForSession } from '@/lib/server/services/admin/sessions'
import { getWebActor } from '@/lib/server/services/admin/web-actor'

export async function registerSessionAction(
  sessionId: string,
  _prevState: { error: string },
  _formData: FormData
) {
  void _prevState
  void _formData

  const actor = await getWebActor()
  if (!actor) {
    return forbidden()
  }

  const result = await registerForSession(actor, sessionId)
  if (!result.ok) {
    // 신청할 수 없는 세션(마감·비공개)은 403, 그 외는 폼 오류로 보여 준다.
    return result.code === 'FORBIDDEN' ? forbidden() : { error: result.message }
  }

  return redirect(await getLocalizedAdminPath(`/admin/sessions/${sessionId}`))
}
