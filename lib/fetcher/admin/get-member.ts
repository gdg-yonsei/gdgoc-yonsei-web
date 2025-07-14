import 'server-only'
import { unstable_cache } from 'next/cache'
import db from '@/db'
import { users } from '@/db/schema/users'
import { desc, eq } from 'drizzle-orm'
import { usersToParts } from '@/db/schema/users-to-parts'
import { parts } from '@/db/schema/parts'
import { generations } from '@/db/schema/generations'

export const preload = (userId: string) => {
  void getMember(userId)
}

/**
 * Get Member Data
 * @param userId - user id
 */
export const getMember = unstable_cache(
  async (userId: string) => {
    console.log(new Date(), 'Fetch Member Data:', userId)
    return (
      await db
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
          email: users.email,
          githubId: users.githubId,
          instagramId: users.instagramId,
          linkedInId: users.linkedInId,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          isForeigner: users.isForeigner,
          generation: generations.name,
          major: users.major,
          studentId: users.studentId,
          telephone: users.telephone,
        })
        .from(users)
        .where(eq(users.id, userId))
        .leftJoin(usersToParts, eq(usersToParts.userId, users.id))
        .leftJoin(parts, eq(parts.id, usersToParts.partId))
        .leftJoin(generations, eq(generations.id, parts.generationsId))
        .orderBy(desc(generations.id), desc(parts.id), desc(users.updatedAt))
        .limit(1)
    )[0]
  },
  [],
  {
    tags: ['members'],
  }
)
