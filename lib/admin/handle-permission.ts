import 'server-only'
import getUserRole from '@/lib/admin/get-user-role'
import checkPermission from '@/lib/admin/check-permission'

export type ActionType = 'get' | 'post' | 'put' | 'delete'
export type ResourceType =
  | 'members'
  | 'membersRole'
  | 'projects'
  | 'sessions'
  | 'generations'
  | 'membersPage'
  | 'profilePage'
  | 'projectsPage'
  | 'sessionsPage'
  | 'adminPage'
  | 'generationsPage'

/**
 * 사용자 권한 확인 함수
 * @param userId - 사용자 ID
 * @param action - action type (get, post, put, delete)
 * @param resource - 접근 데이터
 * @param dataOwnerId - 데이터 소유자 ID
 */
export default async function handlePermission(
  userId: string | undefined | null,
  action: ActionType,
  resource: ResourceType,
  dataOwnerId?: string
): Promise<boolean> {
  // 사용자 ID가 없으면 권한이 없다고 판단
  if (!userId) {
    return false
  }

  /**
   * 사용자 Role 가져오기
   */
  const userRole = await getUserRole(userId)

  // 사용자 권한 확인
  return checkPermission(userId, dataOwnerId)[userRole][action][resource]
}
