'use server'

/**
 * 파트 수정 Server Action. 항목 id는 `bind`로 고정해 넘긴다.
 */
import {
  runAdminFormAction,
  type AdminFormState,
} from '@/lib/server/actions/admin-form-action'
import { parsePartForm } from '@/lib/server/form-data/admin-forms'
import { updatePart } from '@/lib/server/services/admin/parts'

/** 파트 정보와 구성원을 고치고 파트 상세로 이동한다. 첫 인자는 `bind`로 고정한다. */
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
