'use server'

import { forbidden, redirect } from 'next/navigation'
import getProjectFormData from '@/lib/server/form-data/get-project-form-data'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import { resolveAdminGenerationScope } from '@/lib/server/admin-generation-scope'
import { createProject } from '@/lib/server/services/admin/projects'
import {
  getWebActor,
  toActionError,
} from '@/lib/server/services/admin/web-actor'

export async function createProjectAction(
  _prev: { error: string },
  formData: FormData
) {
  const actor = await getWebActor()
  if (!actor) {
    return forbidden()
  }

  const formValues = getProjectFormData(formData)

  // 웹 화면은 현재 선택된 기수에서만 데이터를 만든다.
  const resolvedScope = await resolveAdminGenerationScope(actor.userId)
  if (
    resolvedScope.scope?.kind !== 'generation' ||
    resolvedScope.scope.generationId !== Number(formValues.generationId)
  ) {
    return { error: 'Select a specific generation scope before creating data.' }
  }

  const result = await createProject(actor, formValues)
  if (!result.ok) {
    return toActionError(result)
  }

  redirect(await getLocalizedAdminPath('/admin/projects'))
}
