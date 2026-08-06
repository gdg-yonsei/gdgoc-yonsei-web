import 'server-only'

import { forbidden } from 'next/navigation'
import { auth } from '@/auth'
import handlePermission, {
  type ActionType,
  type ResourceType,
} from '@/lib/server/permission/handle-permission'

/**
 * 권한이 없으면 `forbidden()` 으로 렌더링을 중단하고, 있으면 세션을 돌려준다.
 *
 * 관리자 레이아웃/페이지 열한 곳이 `auth()` 와 `handlePermission()` 을 각자 호출하는
 * 서른 줄짜리 동일한 가드를 복사해 쓰고 있었다. 리소스 이름만 다른 코드라
 * 주석이 원본 그대로 남아 실제 검사 대상과 어긋난 파일도 있었다.
 */
export async function requirePermission(
  action: ActionType,
  resource: ResourceType,
  dataOwnerId?: string
) {
  const session = await auth()

  if (
    !(await handlePermission(session?.user?.id, action, resource, dataOwnerId))
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
  const session = await auth()
  const userId = session?.user?.id

  if (!(await handlePermission(userId, action, resource, userId))) {
    forbidden()
  }

  return session
}
