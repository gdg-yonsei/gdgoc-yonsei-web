'use server'

/**
 * 세션 생성 Server Action. 성공하면 목록 또는 상세로 이동하고, 실패하면 폼에 오류 문구를 돌려준다.
 */
import {
  requireCreationScope,
  runAdminFormAction,
  type AdminFormState,
} from '@/lib/server/actions/admin-form-action'
import { parseSessionForm } from '@/lib/server/form-data/admin-forms'
import { createSession } from '@/lib/server/services/admin/sessions'

/**
 * 현재 선택한 기수에 세션을 만들고 세션 목록으로 이동한다.
 * 세션 폼에는 기수 필드가 없으므로, 고른 파트가 선택한 기수에 속하는지는 서비스가 확인한다.
 */
export async function createSessionAction(
  _prev: AdminFormState,
  formData: FormData
) {
  return runAdminFormAction({
    run: async (actor) => {
      const scope = await requireCreationScope(actor)
      if (!scope.ok) return scope
      return createSession(actor, parseSessionForm(formData), {
        expectedGenerationId: scope.data,
      })
    },
    redirectTo: '/admin/sessions',
  })
}
