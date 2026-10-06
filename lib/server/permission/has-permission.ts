// 웹 화면·버튼은 Actor 없이 DB 역할과 정책 표로 권한을 판단한다.
import 'server-only'

import { getUserRole } from '@/lib/server/fetcher/admin/get-user-role'
import {
  isAllowed,
  type ActionType,
  type ResourceType,
} from '@/lib/server/permission/policy'

export type { ActionType, ResourceType }

// 미로그인은 항상 false다. dataOwnerId는 본인 데이터 규칙에 쓸 소유자 ID다.
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
  })
}
