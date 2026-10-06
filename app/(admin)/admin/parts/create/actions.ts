'use server'

import {
  requireCreationScope,
  runAdminFormAction,
  type AdminFormState,
} from '@/lib/server/actions/admin-form-action'
import { parsePartForm } from '@/lib/server/form-data/admin-forms'
import { createPart } from '@/lib/server/services/admin/parts'

export async function createPartAction(
  _prev: AdminFormState,
  formData: FormData
) {
  return runAdminFormAction({
    run: async (actor) => {
      const input = parsePartForm(formData)
      const scope = await requireCreationScope(actor, input.generationId)
      return scope.ok ? createPart(actor, input) : scope
    },
    redirectTo: '/admin/parts',
  })
}
