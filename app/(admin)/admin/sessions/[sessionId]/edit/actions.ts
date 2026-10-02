'use server'

/**
 * 세션 수정 Server Action. 항목 id는 `bind`로 고정해 넘긴다.
 */
import {
  runAdminFormAction,
  type AdminFormState,
} from '@/lib/server/actions/admin-form-action'
import { parseSessionForm } from '@/lib/server/form-data/admin-forms'
import { updateSession } from '@/lib/server/services/admin/sessions'

/** 세션을 고치고 세션 상세로 이동한다. 첫 인자는 `bind`로 고정한다. */
export async function updateSessionAction(
  sessionId: string,
  _prev: AdminFormState,
  formData: FormData
) {
  return runAdminFormAction({
    run: (actor) => updateSession(actor, sessionId, parseSessionForm(formData)),
    redirectTo: `/admin/sessions/${sessionId}`,
  })
}
