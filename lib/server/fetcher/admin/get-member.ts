import 'server-only'
import db from '@/db'
import { users } from '@/db/schema/users'
import { desc, eq, sql } from 'drizzle-orm'
import { usersToParts } from '@/db/schema/users-to-parts'
import { parts } from '@/db/schema/parts'
import { generations } from '@/db/schema/generations'

export async function getMember(userId: string, generationId?: number | null) {
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
      generationId: generations.id,
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
    .orderBy(
      generationId
        ? desc(
            sql<number>`CASE WHEN ${generations.id} = ${generationId} THEN 1 ELSE 0 END`
          )
        : desc(generations.id),
      desc(generations.id),
      desc(parts.id),
      desc(users.updatedAt)
    )
    .limit(1)

  return result[0]
}
