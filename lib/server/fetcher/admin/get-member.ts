import 'server-only'
import db from '@/db'
import { users } from '@/db/schema/users'
import { desc, eq } from 'drizzle-orm'
import { usersToParts } from '@/db/schema/users-to-parts'
import { parts } from '@/db/schema/parts'
import { generations } from '@/db/schema/generations'
import cacheTag from '@/lib/server/cacheTag'

export const preload = (userId: string) => {
  void getMember(userId)
}
export async function getMember(userId: string) {
  'use cache'
  cacheTag('members', 'generations', 'parts')

  console.log(new Date(), 'Fetch Member Data:', userId)
  const result = await db
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
      sessionNotiEmail: users.sessionNotiEmail,
    })
    .from(users)
    .where(eq(users.id, userId))
    .leftJoin(usersToParts, eq(usersToParts.userId, users.id))
    .leftJoin(parts, eq(parts.id, usersToParts.partId))
    .leftJoin(generations, eq(generations.id, parts.generationsId))
    .orderBy(desc(generations.id), desc(parts.id), desc(users.updatedAt))
    .limit(1)

  return result[0]
}
