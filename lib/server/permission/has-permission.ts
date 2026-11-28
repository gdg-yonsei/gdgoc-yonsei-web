// 웹 화면·버튼은 Actor 없이 DB 역할과 정책 표로 권한을 판단한다.
// 이 판단은 노출 제어용이라 기수 범위를 확인하지 않는다. 데이터 접근은 서비스가
// authorizeAccess로 기수까지 다시 확인한다.
import 'server-only'

import { getUserRole } from '@/lib/server/fetcher/admin/get-user-role'
import {
  isAllowed,
  type ActionType,
  type ResourceType,
} from '@/lib/server/permission/policy'

export type { ActionType, ResourceType }

// 미로그인은 항상 false다. dataOwnerId는 본인 데이터 규칙에 쓸 소유자 ID다.
// 기수 범위 규칙은 "소속 기수의 데이터라면 가능한지"로 판단한다.
export async function hasPermission(
  userId: string | undefined | null,
  action: ActionType,
  resource: ResourceType,
  dataOwnerId?: string
): Promise<boolean> {
  if (!userId) {
    return false
  }

  const role = await getUserRole(userId)
  return isAllowed(role, action, resource, {
    isOwner: userId === dataOwnerId,
    inGeneration: true,
  })
}
