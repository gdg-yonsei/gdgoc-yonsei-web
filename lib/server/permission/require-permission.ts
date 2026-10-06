// 이 가드는 화면 접근만 막는다. 쓰기 서비스는 authorize로 권한을 다시 확인해야 한다.
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

// 권한이 없으면 forbidden으로 중단한다. dataOwnerId는 own 규칙의 데이터 소유자다.
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

// 기수 접근은 LEAD에게 전체, 그 외에는 소속 기수만 허용한다. 실패는 403이다.
export async function requireGenerationAccess(
  generationId: number | null | undefined
) {
  const actor = await getWebActor()
  if (!actor || !(await canAccessGeneration(actor, generationId))) {
    forbidden()
  }
}
