'use server'

import { forbidden, redirect } from 'next/navigation'
import getProjectFormData from '@/lib/server/form-data/get-project-form-data'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import { updateProject } from '@/lib/server/services/admin/projects'
import {
  getWebActor,
  toActionError,
} from '@/lib/server/services/admin/web-actor'

export async function updateProjectAction(
  projectId: string,
  _prevState: { error: string },
  formData: FormData
) {
  const actor = await getWebActor()
  if (!actor) {
    return forbidden()
  }

  const result = await updateProject(
    actor,
    projectId,
    getProjectFormData(formData)
  )
  if (!result.ok) {
    return toActionError(result)
  }

  redirect(await getLocalizedAdminPath(`/admin/projects/${projectId}`))
}
