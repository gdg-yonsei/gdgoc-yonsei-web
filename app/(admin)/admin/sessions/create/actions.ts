'use server'

import { forbidden, redirect } from 'next/navigation'
import getSessionFormData from '@/lib/server/form-data/get-session-form-data'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import { resolveAdminGenerationScope } from '@/lib/server/admin-generation-scope'
import { createSession } from '@/lib/server/services/admin/sessions'
import {
  getWebActor,
  toActionError,
} from '@/lib/server/services/admin/web-actor'

export async function createSessionAction(
  _prev: { error: string },
  formData: FormData
) {
  const actor = await getWebActor()
  if (!actor) {
    return forbidden()
  }

  // 웹 화면은 현재 선택된 기수에서만 데이터를 만든다.
  const resolvedScope = await resolveAdminGenerationScope(actor.userId)
  if (resolvedScope.scope?.kind !== 'generation') {
    return { error: 'Select a specific generation scope before creating data.' }
  }

  const result = await createSession(actor, getSessionFormData(formData))
  if (!result.ok) {
    return toActionError(result)
  }

  redirect(await getLocalizedAdminPath('/admin/sessions'))
}
