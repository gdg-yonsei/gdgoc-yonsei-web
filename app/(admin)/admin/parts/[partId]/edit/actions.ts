'use server'

import {
  runAdminFormAction,
  type AdminFormState,
} from '@/lib/server/actions/admin-form-action'
import { parsePartForm } from '@/lib/server/form-data/admin-forms'
import { updatePart } from '@/lib/server/services/admin/parts'

export async function updatePartAction(
  partId: string,
  _prev: AdminFormState,
  formData: FormData
) {
  return runAdminFormAction({
    run: (actor) => updatePart(actor, Number(partId), parsePartForm(formData)),
    redirectTo: `/admin/parts/${partId}`,
  })
}
