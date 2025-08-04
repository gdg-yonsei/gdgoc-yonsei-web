/**
 * @file This file contains a server-side function for fetching a user's role.
 */

import 'server-only'
import db from '@/db'
import { users } from '@/db/schema/users'
import { eq } from 'drizzle-orm'

/**
 * Fetches the role of a given user from the database.
 * If the userId is undefined, it defaults to 'UNVERIFIED'.
 *
 * @param userId - The ID of the user whose role is to be fetched.
 * @returns A promise that resolves to the user's role (e.g., 'MEMBER', 'CORE', 'LEAD', 'ALUMNUS', 'UNVERIFIED').
 */
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
