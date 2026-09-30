'use server'

import { forbidden, redirect } from 'next/navigation'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import {
  removeSessionParticipant,
  unregisterFromSession,
} from '@/lib/server/services/admin/sessions'
import { getWebActor } from '@/lib/server/services/admin/web-actor'

/**
 * 참가자 본인이 세션 등록을 취소한다.
 * 세션이 이미 끝난 뒤에는 이력을 지울 수 없다.
 */
export async function unregisterSessionAction(sessionId: string) {
  const actor = await getWebActor()
  if (!actor) {
    return forbidden()
  }

  const result = await unregisterFromSession(actor, sessionId)
  if (!result.ok) {
    return forbidden()
  }

  return redirect(await getLocalizedAdminPath(`/admin/sessions/${sessionId}`))
}

/**
 * 세션 작성자·코어 이상이 특정 참가자를 명단에서 제거한다.
 */
export async function removeParticipantAction(
  sessionId: string,
  userId: string
) {
  const actor = await getWebActor()
  if (!actor) {
    return forbidden()
  }

  const result = await removeSessionParticipant(actor, sessionId, userId)
  if (!result.ok) {
    return forbidden()
  }

  return redirect(await getLocalizedAdminPath(`/admin/sessions/${sessionId}`))
}
