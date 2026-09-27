'use server'

import { forbidden, redirect } from 'next/navigation'
import getPartFormData from '@/lib/server/form-data/get-part-form-data'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import { resolveAdminGenerationScope } from '@/lib/server/admin-generation-scope'
import { createPart } from '@/lib/server/services/admin/parts'
import {
  getWebActor,
  toActionError,
} from '@/lib/server/services/admin/web-actor'

/**
 * Create Part Action
 * @param prev - previous state for form error
 * @param formData - part data
 */
export async function createPartAction(
  _prev: { error: string },
  formData: FormData
) {
  const actor = await getWebActor()
  if (!actor) {
    return forbidden()
  }

  // form data 에서 part data 추출
  const formValues = getPartFormData(formData)

  // 웹 화면은 현재 선택된 기수에서만 데이터를 만든다.
  const resolvedScope = await resolveAdminGenerationScope(actor.userId)
  if (
    resolvedScope.scope?.kind !== 'generation' ||
    resolvedScope.scope.generationId !== formValues.generationId
  ) {
    return { error: 'Select a specific generation scope before creating data.' }
  }

  const result = await createPart(actor, formValues)
  if (!result.ok) {
    return toActionError(result)
  }

  redirect(await getLocalizedAdminPath('/admin/parts'))
}
