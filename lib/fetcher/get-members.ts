import { unstable_cache } from 'next/cache'
import db from '@/db'
import { users } from '@/db/schema/users'
import { desc, eq, ne } from 'drizzle-orm'
import { usersToParts } from '@/db/schema/users-to-parts'
import { parts } from '@/db/schema/parts'
import { usersToGenerations } from '@/db/schema/users-to-generations'
import { generations } from '@/db/schema/generations'

export const preload = () => {
  void getMembers()
}

export const getMembers = unstable_cache(
  async () => {
    console.log(new Date(), 'Fetch Members Data')
    return db
      .select({
        id: users.id,
        name: users.name,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        image: users.image,
        part: parts.name,
        generation: generations.name,
      })
      .from(users)
      .where(ne(users.role, 'UNVERIFIED'))
      .leftJoin(usersToParts, eq(usersToParts.userId, users.id))
      .leftJoin(parts, eq(parts.id, usersToParts.partId))
      .leftJoin(usersToGenerations, eq(usersToGenerations.userId, users.id))
      .leftJoin(
        generations,
        eq(generations.id, usersToGenerations.generationId)
      )
      .orderBy(desc(users.updatedAt))
  },
  [],
  {
    tags: ['members'],
  }
)
