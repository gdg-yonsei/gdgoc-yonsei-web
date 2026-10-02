'use server'

/**
 * 파트 생성 Server Action. 성공하면 목록 또는 상세로 이동하고, 실패하면 폼에 오류 문구를 돌려준다.
 */
import {
  requireCreationScope,
  runAdminFormAction,
  type AdminFormState,
} from '@/lib/server/actions/admin-form-action'
import { parsePartForm } from '@/lib/server/form-data/admin-forms'
import { createPart } from '@/lib/server/services/admin/parts'

/** 현재 선택한 기수에 파트를 만들고 파트 목록으로 이동한다. */
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
