'use server'

import {
  runAdminFormAction,
  type AdminFormState,
} from '@/lib/server/actions/admin-form-action'
import { parseProjectForm } from '@/lib/server/form-data/admin-forms'
import { updateProject } from '@/lib/server/services/admin/projects'

export async function updateProjectAction(
  projectId: string,
  _prev: AdminFormState,
  formData: FormData
) {
  return runAdminFormAction({
    run: (actor) => updateProject(actor, projectId, parseProjectForm(formData)),
    redirectTo: `/admin/projects/${projectId}`,
  })
}
