'use server'

import {
  runAdminFormAction,
  type AdminFormState,
} from '@/lib/server/actions/admin-form-action'
import { parseSessionForm } from '@/lib/server/form-data/admin-forms'
import { updateSession } from '@/lib/server/services/admin/sessions'

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
