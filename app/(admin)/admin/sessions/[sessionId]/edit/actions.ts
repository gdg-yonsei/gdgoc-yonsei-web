'use server'

import { forbidden, redirect } from 'next/navigation'
import getSessionFormData from '@/lib/server/form-data/get-session-form-data'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import { updateSession } from '@/lib/server/services/admin/sessions'
import {
  getWebActor,
  toActionError,
} from '@/lib/server/services/admin/web-actor'

export async function updateSessionAction(
  sessionId: string,
  _prevState: { error: string },
  formData: FormData
) {
  const actor = await getWebActor()
  if (!actor) {
    return forbidden()
  }

  const result = await updateSession(
    actor,
    sessionId,
    getSessionFormData(formData)
  )
  if (!result.ok) {
    return toActionError(result)
  }

  redirect(await getLocalizedAdminPath(`/admin/sessions/${sessionId}`))
}
