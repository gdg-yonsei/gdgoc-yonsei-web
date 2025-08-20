import 'server-only'
import db from '@/db'
import { users } from '@/db/schema/users'
import { eq } from 'drizzle-orm'

export default async function getUserRole(userId: string | undefined) {
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

  // Return the user's role. Assuming a user with a valid ID will always have a role.
  return result[0].role
}
