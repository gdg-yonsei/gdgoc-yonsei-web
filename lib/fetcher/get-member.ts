import { unstable_cache } from 'next/cache'
import db from '@/db'
import { users } from '@/db/schema/users'
import { eq } from 'drizzle-orm'
import { usersToParts } from '@/db/schema/users-to-parts'
import { parts } from '@/db/schema/parts'
import { usersToGenerations } from '@/db/schema/users-to-generations'
import { generations } from '@/db/schema/generations'

export const preload = (userId: string) => {
  void getMember(userId)
}

export const getMember = unstable_cache(
  async (userId: string) => {
    console.log(new Date(), 'Fetch Member Data:', userId)
    return (
      await db
        .select({
          id: users.id,
          name: users.name,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          image: users.image,
          part: parts.name,
          generation: generations.name,
          email: users.email,
          githubId: users.githubId,
          instagramId: users.instagramId,
          linkedInId: users.linkedInId,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          isForeigner: users.isForeigner,
        })
        .from(users)
        .where(eq(users.id, userId))
        .leftJoin(usersToParts, eq(usersToParts.userId, users.id))
        .leftJoin(parts, eq(parts.id, usersToParts.partId))
        .leftJoin(usersToGenerations, eq(usersToGenerations.userId, users.id))
        .leftJoin(
          generations,
          eq(generations.id, usersToGenerations.generationId)
        )
        .limit(1)
    )[0]
  },
  [],
  {
    tags: ['members'],
  }
)
