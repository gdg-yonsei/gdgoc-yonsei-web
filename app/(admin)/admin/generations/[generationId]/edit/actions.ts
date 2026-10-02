'use server'

/**
 * 기수 수정 Server Action. 항목 id는 `bind`로 고정해 넘긴다.
 */
import {
  runAdminFormAction,
  type AdminFormState,
} from '@/lib/server/actions/admin-form-action'
import { parseGenerationForm } from '@/lib/server/form-data/admin-forms'
import { updateGeneration } from '@/lib/server/services/admin/generations'

/** 기수 정보를 고치고 기수 상세로 이동한다. 첫 인자는 `bind`로 고정한다. */
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
