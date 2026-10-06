// 관리자 폼 액션은 로그인·권한 실패를 403, 다른 실패를 폼 오류로 돌려주고 성공하면 지역화 경로로 이동한다.
import 'server-only'

import { forbidden, redirect } from 'next/navigation'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import { resolveAdminGenerationScope } from '@/lib/server/admin-generation-scope'
import {
  fail,
  ok,
  type Actor,
  type ServiceResult,
} from '@/lib/server/services/admin/types'
import {
  getWebActor,
  toActionError,
} from '@/lib/server/services/admin/web-actor'

export type AdminFormState = { error: string }

// 성공 redirect는 예외로 흐름을 끝내므로 반환값은 항상 실패 상태다.
export async function runAdminFormAction<T>({
  run,
  redirectTo,
}: {
  run: (actor: Actor) => Promise<ServiceResult<T>>
  redirectTo: string | ((data: T) => string)
}): Promise<AdminFormState> {
  const actor = await getWebActor()
  if (!actor) {
    return forbidden()
  }

  const result = await run(actor)
  if (!result.ok) {
    return toActionError(result)
  }

  const path =
    typeof redirectTo === 'function' ? redirectTo(result.data) : redirectTo
  redirect(await getLocalizedAdminPath(path))
}

// 웹 생성은 전체 범위를 거절하고 현재 선택한 기수만 허용한다. expectedGenerationId도 같아야 한다.
// MCP는 기수를 직접 지정하므로 이 웹 폼 검사를 거치지 않는다.
export async function requireCreationScope(
  actor: Actor,
  expectedGenerationId?: number
): Promise<ServiceResult<number>> {
  const { scope } = await resolveAdminGenerationScope(actor.userId)
  if (
    scope?.kind !== 'generation' ||
    (expectedGenerationId !== undefined &&
      scope.generationId !== expectedGenerationId)
  ) {
    return fail(
      'VALIDATION',
      'Select a specific generation scope before creating data.'
    )
  }
  return ok(scope.generationId)
}
