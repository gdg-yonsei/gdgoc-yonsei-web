'use server'

import {
  runAdminFormAction,
  type AdminFormState,
} from '@/lib/server/actions/admin-form-action'
import {
  removeSessionParticipant,
  unregisterFromSession,
} from '@/lib/server/services/admin/sessions'

/** `sessionId`는 `bind`로 고정하고, 종료된 세션 등 취소 불가 사유는 폼에 표시한다. */
export async function unregisterSessionAction(
  sessionId: string
): Promise<AdminFormState> {
  return runAdminFormAction({
    run: (actor) => unregisterFromSession(actor, sessionId),
    redirectTo: `/admin/sessions/${sessionId}`,
  })
}

/** 세션 작성자·코어 이상이 특정 참가자를 명단에서 제거한다. */
export async function removeParticipantAction(
  sessionId: string,
  userId: string
): Promise<AdminFormState> {
  return runAdminFormAction({
    run: (actor) => removeSessionParticipant(actor, sessionId, userId),
    redirectTo: `/admin/sessions/${sessionId}`,
  })
}
