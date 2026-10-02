/**
 * 사용자 역할 조회.
 *
 * 관리자 화면 한 번을 그리는 동안 레이아웃, 내비게이션, 권한 가드, 기수 범위
 * 계산이 각각 역할을 확인한다. React `cache()`로 요청 단위 메모이즈를 해서 같은
 * 요청에서는 DB를 한 번만 조회한다(요청이 끝나면 캐시도 사라진다).
 */
import 'server-only'

import { cache } from 'react'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users, type Role } from '@/db/schema/users'

/**
 * 사용자 ID로 역할을 읽는다.
 * 로그인하지 않았거나 사용자를 찾지 못하면 가장 낮은 권한인 `UNVERIFIED`로 본다.
 */
export const getUserRole = cache(async function getUserRole(
  userId: string | undefined
): Promise<Role> {
  if (!userId) {
    return 'UNVERIFIED'
  }

  const result = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  return result[0]?.role ?? 'UNVERIFIED'
})
