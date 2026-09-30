'use server'

import { forbidden, redirect } from 'next/navigation'
import getPartFormData from '@/lib/server/form-data/get-part-form-data'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import { updatePart } from '@/lib/server/services/admin/parts'
import {
  getWebActor,
  toActionError,
} from '@/lib/server/services/admin/web-actor'

/**
 * Update Part Action
 * @param partId - part id
 * @param prevState - previous state for form error
 * @param formData - part data
 */
export async function updatePartAction(
  partId: string,
  _prevState: { error: string },
  formData: FormData
) {
  const actor = await getWebActor()
  if (!actor) {
    return forbidden()
  }

  const result = await updatePart(
    actor,
    Number(partId),
    getPartFormData(formData)
  )
  if (!result.ok) {
    return toActionError(result)
  }

  redirect(await getLocalizedAdminPath(`/admin/parts/${partId}`))
}
