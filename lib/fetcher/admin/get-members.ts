import 'server-only'
import { unstable_cache } from 'next/cache'
import db from '@/db'
import { users } from '@/db/schema/users'
import { desc, eq, ne } from 'drizzle-orm'
import { usersToParts } from '@/db/schema/users-to-parts'
import { parts } from '@/db/schema/parts'
import { generations } from '@/db/schema/generations'

export const preload = () => {
  void getMembers()
}

/**
 * Get Members Data
 */
export const getMembers = unstable_cache(
  async () => {
    console.log(new Date(), 'Fetch Members Data')

    const userList = await db
      .select({
        id: users.id,
        name: users.name,
        firstName: users.firstName,
        lastName: users.lastName,
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
  },
  [],
  {
    tags: ['members'],
  }
)
