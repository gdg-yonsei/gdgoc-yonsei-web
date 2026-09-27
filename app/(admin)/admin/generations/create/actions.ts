'use server'

import { forbidden, redirect } from 'next/navigation'
import getGenerationFormData from '@/lib/server/form-data/get-generation-form-data'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import { createGeneration } from '@/lib/server/services/admin/generations'
import {
  getWebActor,
  toActionError,
} from '@/lib/server/services/admin/web-actor'

export async function createGenerationAction(
  _prev: { error: string },
  formData: FormData
) {
  const actor = await getWebActor()
  if (!actor) {
    return forbidden()
  }

  const result = await createGeneration(actor, getGenerationFormData(formData))
  if (!result.ok) {
    return toActionError(result)
  }

  // generation 페이지로 이동
  redirect(await getLocalizedAdminPath('/admin/generations'))
}
