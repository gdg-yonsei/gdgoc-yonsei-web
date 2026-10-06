'use server'

import {
  runAdminFormAction,
  type AdminFormState,
} from '@/lib/server/actions/admin-form-action'
import { registerForSession } from '@/lib/server/services/admin/sessions'

/** 마감·비공개 세션은 403, 정원 초과·중복 신청은 폼 오류로 표시한다. `sessionId`는 `bind`로 고정한다. */
export async function registerSessionAction(
  sessionId: string
): Promise<AdminFormState> {
  return runAdminFormAction({
    run: (actor) => registerForSession(actor, sessionId),
    redirectTo: `/admin/sessions/${sessionId}`,
  })
}
