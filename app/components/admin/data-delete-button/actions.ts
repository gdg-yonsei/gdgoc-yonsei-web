'use server'

import {
  runAdminFormAction,
  type AdminFormState,
} from '@/lib/server/actions/admin-form-action'
import { deleteGeneration } from '@/lib/server/services/admin/generations'
import { deletePart } from '@/lib/server/services/admin/parts'
import { deleteProject } from '@/lib/server/services/admin/projects'
import { deleteSession } from '@/lib/server/services/admin/sessions'
import type { Actor, ServiceResult } from '@/lib/server/services/admin/types'
import {
  deleteResourceValidation,
  type DeleteResourceType,
} from '@/lib/validations/admin-api'

/** 세션·프로젝트 id는 UUID 문자열, 기수·파트 id는 숫자여서 삭제 서비스에 맞춰 변환한다. */
const deleteServices: Record<
  DeleteResourceType,
  (actor: Actor, id: string) => Promise<ServiceResult<unknown>>
> = {
  sessions: (actor: Actor, id: string) => deleteSession(actor, id),
  projects: (actor: Actor, id: string) => deleteProject(actor, id),
  generations: (actor: Actor, id: string) =>
    deleteGeneration(actor, Number(id)),
  parts: (actor: Actor, id: string) => deletePart(actor, Number(id)),
}

export async function deleteResourceAction(
  _prev: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  const validation = deleteResourceValidation.safeParse({
    dataType: formData.get('dataType'),
    dataId: formData.get('dataId'),
  })
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message ?? 'Validation failed',
    }
  }

  const { dataType, dataId } = validation.data
  return runAdminFormAction({
    run: (actor) => deleteServices[dataType](actor, dataId),
    redirectTo: `/admin/${dataType}`,
  })
}
