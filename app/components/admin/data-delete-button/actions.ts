'use server'

import { forbidden, redirect } from 'next/navigation'
import { deleteResourceValidation } from '@/lib/validations/admin-api'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import { deleteGeneration } from '@/lib/server/services/admin/generations'
import { deletePart } from '@/lib/server/services/admin/parts'
import { deleteProject } from '@/lib/server/services/admin/projects'
import { deleteSession } from '@/lib/server/services/admin/sessions'
import {
  getWebActor,
  toActionError,
} from '@/lib/server/services/admin/web-actor'

export default async function deleteResourceAction(
  prev: { error: string },
  formData: FormData
) {
  void prev

  const validationResult = deleteResourceValidation.safeParse({
    dataType: formData.get('dataType'),
    dataId: formData.get('dataId'),
  })

  if (!validationResult.success) {
    return {
      error: validationResult.error.issues[0]?.message ?? 'Validation failed',
    }
  }

  const { dataType, dataId } = validationResult.data

  const actor = await getWebActor()
  if (!actor) {
    return forbidden()
  }

  const result =
    dataType === 'sessions'
      ? await deleteSession(actor, dataId)
      : dataType === 'projects'
        ? await deleteProject(actor, dataId)
        : dataType === 'generations'
          ? await deleteGeneration(actor, Number(dataId))
          : await deletePart(actor, Number(dataId))

  if (!result.ok) {
    return toActionError(result)
  }

  redirect(await getLocalizedAdminPath('/admin/' + dataType))
}
