'use server'

/**
 * 세션 참가 취소(본인)·참가자 제거(관리자) Server Action.
 */
import {
  runAdminFormAction,
  type AdminFormState,
} from '@/lib/server/actions/admin-form-action'
import {
  removeSessionParticipant,
  unregisterFromSession,
} from '@/lib/server/services/admin/sessions'

/**
 * 참가자 본인이 세션 등록을 취소한다. 폼에서 `bind`로 `sessionId`를 고정해 부른다.
 * 이미 끝난 세션처럼 취소할 수 없는 경우는 폼에 이유를 보여 준다.
 */
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
