import 'server-only'

import { unstable_noStore as noStore } from 'next/cache'
import { and, asc, desc, eq, ne, sql } from 'drizzle-orm'
import db from '@/db'
import { generations } from '@/db/schema/generations'
import { parts } from '@/db/schema/parts'
import { users } from '@/db/schema/users'
import { usersToParts } from '@/db/schema/users-to-parts'
import { type AdminGenerationScope } from '@/lib/server/admin-generation-scope'

export type AdminMemberListItem = {
  id: string
  name: string | null
  firstName: string | null
  firstNameKo: string | null
  lastName: string | null
  lastNameKo: string | null
  role: string
  image: string | null
  part: string | null
  generationId: number | null
  generation: string | null
  isForeigner: boolean
}

const membershipPriority = sql<number>`
  CASE
    WHEN ${usersToParts.userType} = 'Primary' THEN 0
    ELSE 1
  END
`

export const preloadAdminMembers = (scope?: AdminGenerationScope | null) => {
  void getMembers(scope)
}

export async function getMembers(scope?: AdminGenerationScope | null) {
  noStore()

  const rows = await db
    .selectDistinctOn([users.id, generations.id], {
      id: users.id,
      name: users.name,
      firstName: users.firstName,
      firstNameKo: users.firstNameKo,
      lastName: users.lastName,
      lastNameKo: users.lastNameKo,
      role: users.role,
      image: users.image,
      part: parts.name,
      generationId: generations.id,
      generation: generations.name,
      isForeigner: users.isForeigner,
    })
    .from(usersToParts)
    .innerJoin(users, eq(usersToParts.userId, users.id))
    .innerJoin(parts, eq(usersToParts.partId, parts.id))
    .innerJoin(generations, eq(parts.generationsId, generations.id))
    .where(
      scope?.kind === 'generation'
        ? and(ne(users.role, 'UNVERIFIED'), eq(generations.id, scope.generationId))
        : ne(users.role, 'UNVERIFIED')
    )
    .orderBy(
      users.id,
      generations.id,
      membershipPriority,
      asc(parts.displayOrder),
      asc(parts.id),
      desc(users.updatedAt)
    )

  return [...rows].sort((left, right) => {
    const generationDifference = (right.generationId ?? 0) - (left.generationId ?? 0)
    if (generationDifference !== 0) {
      return generationDifference
    }

    const partName = (left.part ?? '').localeCompare(right.part ?? '')
    if (partName !== 0) {
      return partName
    }

    return (left.name ?? '').localeCompare(right.name ?? '')
  }) as AdminMemberListItem[]
}
