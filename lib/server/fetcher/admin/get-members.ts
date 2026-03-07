import 'server-only'
import db from '@/db'
import { users } from '@/db/schema/users'
import { and, desc, eq, ne } from 'drizzle-orm'
import { usersToParts } from '@/db/schema/users-to-parts'
import { parts } from '@/db/schema/parts'
import { generations } from '@/db/schema/generations'
import { unstable_noStore as noStore } from 'next/cache'

export const preloadAdminMembers = () => {
  void getMembers()
}

/**
 * `getMembers` 함수는 전달받은 입력값을 바탕으로 필요한 비즈니스 로직을 수행합니다.
 *
 * 구동 원리:
 * 1. 입력값(없음)을 기준으로 전처리/검증 또는 조회 조건을 구성합니다.
 * 2. 함수 본문의 조건 분기와 동기/비동기 로직을 순서대로 실행합니다.
 * 3. 계산 결과를 반환하거나 캐시/DB/리다이렉트 등 필요한 부수 효과를 반영합니다.
 *
 * 작동 결과:
 * - 호출부에서 즉시 활용 가능한 결과값 또는 실행 상태를 제공합니다.
 * - 후속 로직이 안정적으로 이어질 수 있도록 일관된 동작을 보장합니다.
 */
export async function getMembers() {
  noStore()

  // Fetch all users (except unverified) with their associated part and generation.
  const userList = await db
    .select({
      id: users.id,
      name: users.name,
      firstName: users.firstName,
      firstNameKo: users.firstNameKo,
      lastName: users.lastName,
      lastNameKo: users.lastNameKo,
      role: users.role,
      image: users.image,
      part: parts.name,
      generation: generations.name,
      isForeigner: users.isForeigner,
    })
    .from(users)
    .where(ne(users.role, 'UNVERIFIED'))
    .leftJoin(
      usersToParts,
      and(
        eq(usersToParts.userId, users.id),
        eq(usersToParts.userType, 'Primary')
      )
    )
    .leftJoin(parts, eq(parts.id, usersToParts.partId))
    .leftJoin(generations, eq(generations.id, parts.generationsId))
    .orderBy(desc(generations.name), desc(parts.id), desc(users.updatedAt))

  const uniqueUsersId: string[] = []
  const uniqueUsers = []

  for (const user of userList) {
    if (!uniqueUsersId.includes(user.id)) {
      uniqueUsers.push(user)
      uniqueUsersId.push(user.id)
    }
  }

  return uniqueUsers
}
