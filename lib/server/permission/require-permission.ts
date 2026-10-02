/**
 * 관리자 화면(레이아웃·페이지)용 권한 가드.
 *
 * 조건을 만족하지 않으면 Next.js `forbidden()`으로 렌더링을 멈추고 403 화면을 보여 준다.
 * 쓰기 권한은 서비스 계층(`authorize`)이 다시 확인하므로, 이 가드는 화면 접근만 막는다.
 */
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
 * 권한이 없으면 `forbidden()`으로 렌더링을 중단하고, 있으면 로그인 세션을 돌려준다.
 *
 * @param dataOwnerId - 데이터 소유자 ID. 본인 데이터만 허용하는 규칙(`'own'`)에 쓴다.
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
