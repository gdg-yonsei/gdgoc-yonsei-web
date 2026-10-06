'use server'

import {
  runAdminFormAction,
  type AdminFormState,
} from '@/lib/server/actions/admin-form-action'
import { parseGenerationForm } from '@/lib/server/form-data/admin-forms'
import { createGeneration } from '@/lib/server/services/admin/generations'

export async function createGenerationAction(
  _prev: AdminFormState,
  formData: FormData
) {
  return runAdminFormAction({
    run: (actor) => createGeneration(actor, parseGenerationForm(formData)),
    redirectTo: '/admin/generations',
  })
}
