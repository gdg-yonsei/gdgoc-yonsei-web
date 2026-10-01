'use server'

import {
  requireCreationScope,
  runAdminFormAction,
  type AdminFormState,
} from '@/lib/server/actions/admin-form-action'
import { parseProjectForm } from '@/lib/server/form-data/admin-forms'
import { createProject } from '@/lib/server/services/admin/projects'

/** 현재 선택한 기수에 프로젝트를 만들고 프로젝트 목록으로 이동한다. */
export async function createProjectAction(
  _prev: AdminFormState,
  formData: FormData
) {
  return runAdminFormAction({
    run: async (actor) => {
      const input = parseProjectForm(formData)
      const scope = await requireCreationScope(
        actor,
        Number(input.generationId)
      )
      return scope.ok ? createProject(actor, input) : scope
    },
    redirectTo: '/admin/projects',
  })
}
