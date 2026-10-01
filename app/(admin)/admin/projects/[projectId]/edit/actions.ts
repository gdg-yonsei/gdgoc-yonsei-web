'use server'

import {
  runAdminFormAction,
  type AdminFormState,
} from '@/lib/server/actions/admin-form-action'
import { parseProjectForm } from '@/lib/server/form-data/admin-forms'
import { updateProject } from '@/lib/server/services/admin/projects'

/** 프로젝트를 고치고 프로젝트 상세로 이동한다. 첫 인자는 `bind`로 고정한다. */
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
