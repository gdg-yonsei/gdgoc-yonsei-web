/**
 * 웹 요청의 권한 확인.
 *
 * 로그인 사용자 ID로 DB에서 역할을 읽고 `policy.ts` 표로 판단한다. 레이아웃 가드,
 * 수정·삭제 버튼 노출 여부처럼 Actor를 만들 필요가 없는 곳에서 쓴다.
 */
import 'server-only'

import { getUserRole } from '@/lib/server/fetcher/admin/get-user-role'
import {
  isAllowed,
  type ActionType,
  type ResourceType,
} from '@/lib/server/permission/policy'

/** 호출부가 정책 모듈을 따로 import하지 않도록 권한 타입을 다시 내보낸다. */
export type { ActionType, ResourceType }

/**
 * 사용자가 작업 권한을 가졌는지 확인한다. 로그인하지 않았으면 항상 `false`.
 *
 * @param dataOwnerId - 데이터 소유자 ID. 본인 데이터만 허용하는 규칙에 쓴다.
 */
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
