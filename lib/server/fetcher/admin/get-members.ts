/**
 * @file This file contains server-side functions for fetching a list of all verified members.
 * It uses Next.js's unstable_cache for caching.
 */

import 'server-only'
import db from '@/db'
import { users } from '@/db/schema/users'
import { desc, eq, ne } from 'drizzle-orm'
import { usersToParts } from '@/db/schema/users-to-parts'
import { parts } from '@/db/schema/parts'
import { generations } from '@/db/schema/generations'
import cacheTag from '@/lib/server/cacheTag'

export const preload = () => {
  void getMembers()
}

export async function getMembers() {
  'use cache'
  cacheTag('members', 'parts', 'generations')
  console.log(new Date(), 'Fetch Members Data')

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
    .leftJoin(usersToParts, eq(usersToParts.userId, users.id))
    .leftJoin(parts, eq(parts.id, usersToParts.partId))
    .leftJoin(generations, eq(generations.id, parts.generationsId))
    .orderBy(desc(generations.id), desc(parts.id), desc(users.updatedAt))

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
