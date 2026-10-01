/**
 * 관리자 폼 Server Action 공통 실행기.
 *
 * 모든 관리자 생성·수정 액션은 같은 순서로 동작한다.
 *   1. 로그인한 웹 사용자를 Actor로 만든다(없으면 403).
 *   2. 서비스 함수를 호출한다(권한 검사, 입력 검증, DB 쓰기, 캐시 무효화는 서비스 몫).
 *   3. 권한 실패는 403, 그 밖의 실패는 폼에 보여 줄 오류 문구로 돌려준다.
 *   4. 성공하면 지역화된 관리자 경로로 이동한다.
 * 이 흐름을 한 곳에 모아 각 `actions.ts`가 "무엇을 호출하고 어디로 갈지"만 적게 한다.
 */
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

/** `useActionState`로 폼에 돌려주는 상태. 오류가 없으면 빈 문자열이다. */
export type AdminFormState = { error: string }

/**
 * 관리자 폼 액션을 실행한다. 성공하면 `redirect()`가 예외로 흐름을 끝내므로
 * 실제로 반환되는 값은 항상 실패 상태다.
 *
 * @param run - Actor를 받아 서비스를 호출하는 함수
 * @param redirectTo - 성공 시 이동할 `/admin/...` 경로(결과 데이터로 만들 수도 있다)
 */
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

/**
 * 웹 화면에서 데이터를 만들 때 현재 선택한 기수 범위를 확인한다.
 *
 * 관리자 웹은 "전체 기수" 범위에서는 생성을 막고, 상단에서 고른 기수에만 데이터를
 * 만들게 한다(MCP는 기수를 직접 지정하므로 이 검사를 거치지 않는다).
 *
 * @param expectedGenerationId - 폼이 보낸 기수 ID. 주면 선택한 기수와 같은지도 확인한다.
 * @returns 선택된 기수 ID
 */
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
