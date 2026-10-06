'use server'

import {
  requireCreationScope,
  runAdminFormAction,
  type AdminFormState,
} from '@/lib/server/actions/admin-form-action'
import { parseSessionForm } from '@/lib/server/form-data/admin-forms'
import { createSession } from '@/lib/server/services/admin/sessions'

/** 세션 폼에는 기수 필드가 없어, 고른 파트가 현재 선택한 기수에 속하는지 서비스가 확인한다. */
export async function createSessionAction(
  _prev: AdminFormState,
  formData: FormData
) {
  return runAdminFormAction({
    run: async (actor) => {
      const scope = await requireCreationScope(actor)
      if (!scope.ok) return scope
      return createSession(actor, parseSessionForm(formData), {
        expectedGenerationId: scope.data,
      })
    },
    redirectTo: '/admin/sessions',
  })
}
