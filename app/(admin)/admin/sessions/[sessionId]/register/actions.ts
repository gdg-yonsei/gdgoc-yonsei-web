'use server'

import {
  runAdminFormAction,
  type AdminFormState,
} from '@/lib/server/actions/admin-form-action'
import { registerForSession } from '@/lib/server/services/admin/sessions'

/**
 * 세션 참가 신청. 폼에서 `bind`로 `sessionId`를 고정해 부른다.
 * 신청할 수 없는 세션(마감·비공개)은 403, 정원 초과·중복 신청은 폼 오류로 보여 준다.
 */
export async function registerSessionAction(
  sessionId: string
): Promise<AdminFormState> {
  return runAdminFormAction({
    run: (actor) => registerForSession(actor, sessionId),
    redirectTo: `/admin/sessions/${sessionId}`,
  })
}
