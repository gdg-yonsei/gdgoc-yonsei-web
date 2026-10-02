'use server'

/**
 * 기수 생성 Server Action. 성공하면 목록 또는 상세로 이동하고, 실패하면 폼에 오류 문구를 돌려준다.
 */
import {
  runAdminFormAction,
  type AdminFormState,
} from '@/lib/server/actions/admin-form-action'
import { parseGenerationForm } from '@/lib/server/form-data/admin-forms'
import { createGeneration } from '@/lib/server/services/admin/generations'

/** 기수를 만들고 기수 목록으로 이동한다. */
export async function createGenerationAction(
  _prev: AdminFormState,
  formData: FormData
) {
  return runAdminFormAction({
    run: (actor) => createGeneration(actor, parseGenerationForm(formData)),
    redirectTo: '/admin/generations',
  })
}
