// 레이아웃·메뉴·권한 가드가 같은 요청에서 역할을 읽으므로 React cache로 DB 조회를 한 번으로 합친다.
import 'server-only'

import { cache } from 'react'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users, type Role } from '@/db/schema/users'

// 로그인하지 않았거나 사용자가 없으면 최저 권한 UNVERIFIED로 처리한다.
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
