import 'server-only'

import { forbidden } from 'next/navigation'
import { getAuthSession } from '@/auth'
import { canAccessGeneration } from '@/lib/server/services/admin/authorize'
import { getWebActor } from '@/lib/server/services/admin/web-actor'
import {
  hasPermission,
  type ActionType,
  type ResourceType,
} from '@/lib/server/permission/has-permission'

/**
 * 권한이 없으면 `forbidden()` 으로 렌더링을 중단하고, 있으면 세션을 돌려준다.
 *
 * 관리자 레이아웃/페이지 열한 곳이 `getAuthSession()` 와 `hasPermission()` 을 각자 호출하는
 * 서른 줄짜리 동일한 가드를 복사해 쓰고 있었다. 리소스 이름만 다른 코드라
 * 주석이 원본 그대로 남아 실제 검사 대상과 어긋난 파일도 있었다.
 */
export async function requirePermission(
  action: ActionType,
  resource: ResourceType,
  dataOwnerId?: string
) {
  const session = await getAuthSession()

  if (
    !(await hasPermission(session?.user?.id, action, resource, dataOwnerId))
  ) {
    forbidden()
  }

  return session
}

/**
 * 본인 소유 데이터에 대한 권한을 확인한다.
 * 로그인한 사용자 자신이 데이터 소유자인 경우에 쓴다.
 */
export async function requireOwnPermission(
  action: ActionType,
  resource: ResourceType
) {
  const session = await getAuthSession()
  const userId = session?.user?.id

  if (!(await hasPermission(userId, action, resource, userId))) {
    forbidden()
  }

  return session
}

/**
 * 로그인 사용자가 해당 기수의 데이터를 볼 수 있는지 확인하고, 아니면 403으로 멈춘다.
 * LEAD는 모든 기수, 그 외 역할은 자신이 속한 기수만 볼 수 있다(MCP 조회와 같은 규칙).
 */
export async function requireGenerationAccess(
  generationId: number | null | undefined
) {
  const actor = await getWebActor()
  if (!actor || !(await canAccessGeneration(actor, generationId))) {
    forbidden()
  }
}
