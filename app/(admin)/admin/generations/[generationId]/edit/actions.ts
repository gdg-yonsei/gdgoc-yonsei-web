'use server'

import {
  runAdminFormAction,
  type AdminFormState,
} from '@/lib/server/actions/admin-form-action'
import { parseGenerationForm } from '@/lib/server/form-data/admin-forms'
import { updateGeneration } from '@/lib/server/services/admin/generations'

export async function updateGenerationAction(
  generationId: string,
  _prev: AdminFormState,
  formData: FormData
) {
  return runAdminFormAction({
    run: (actor) =>
      updateGeneration(
        actor,
        Number(generationId),
        parseGenerationForm(formData)
      ),
    redirectTo: `/admin/generations/${generationId}`,
  })
}
