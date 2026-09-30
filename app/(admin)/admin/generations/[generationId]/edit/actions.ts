'use server'

import { forbidden, redirect } from 'next/navigation'
import getGenerationFormData from '@/lib/server/form-data/get-generation-form-data'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import { updateGeneration } from '@/lib/server/services/admin/generations'
import {
  getWebActor,
  toActionError,
} from '@/lib/server/services/admin/web-actor'

/**
 * Update Generation Action
 * @param generationId - generation id
 * @param prevState - previous state for form error
 * @param formData - generation data
 */
export async function updateGenerationAction(
  generationId: string,
  _prevState: { error: string },
  formData: FormData
) {
  const actor = await getWebActor()
  if (!actor) {
    return forbidden()
  }

  const result = await updateGeneration(
    actor,
    Number(generationId),
    getGenerationFormData(formData)
  )
  if (!result.ok) {
    return toActionError(result)
  }

  // 성공 시 해당 generation 페이지로 이동
  redirect(await getLocalizedAdminPath(`/admin/generations/${generationId}`))
}
