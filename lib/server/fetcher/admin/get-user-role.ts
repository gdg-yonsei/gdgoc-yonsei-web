import 'server-only'
import { db } from '@/db'
import { users, type Role } from '@/db/schema/users'
import { eq } from 'drizzle-orm'

export async function getUserRole(userId: string | undefined): Promise<Role> {
  // If no userId is provided, assume the user is unverified.
  if (!userId) {
    return 'UNVERIFIED'
  }

  // Query the database to find the user's role.
  const result = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  // 사용자를 찾지 못한 경우에도 안전하게 기본 권한(UNVERIFIED)을 반환합니다.
  return result[0]?.role ?? 'UNVERIFIED'
}
