import 'server-only'
import db from '@/db'
import { users } from '@/db/schema/users'
import { eq } from 'drizzle-orm'

/**
 * 사용자 Role 가져오는 함수
 * @param userId - 사용자 ID
 */
export default async function getUserRole(userId: string | undefined) {
  if (!userId) {
    return 'UNVERIFIED'
  }
  return (
    await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
  )[0].role
}
