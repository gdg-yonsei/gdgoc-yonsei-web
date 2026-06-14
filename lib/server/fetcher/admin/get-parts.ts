import 'server-only'

import { unstable_noStore as noStore } from 'next/cache'
import { asc, count, desc, eq } from 'drizzle-orm'
import db from '@/db'
import { generations } from '@/db/schema/generations'
import { parts } from '@/db/schema/parts'
import { usersToParts } from '@/db/schema/users-to-parts'
import { type AdminGenerationScope } from '@/lib/server/admin-generation-scope'

export type AdminPartListItem = {
  id: number
  name: string
  description: string | null
  displayOrder: number
  memberCount: number
  generationId: number | null
  generationName: string | null
}

export const preloadParts = (scope?: AdminGenerationScope | null) => {
  void getParts(scope)
}

export async function getParts(scope?: AdminGenerationScope | null) {
  noStore()

  return db
    .select({
      id: parts.id,
      name: parts.name,
      description: parts.description,
      displayOrder: parts.displayOrder,
      memberCount: count(usersToParts.userId),
      generationId: generations.id,
      generationName: generations.name,
    })
    .from(parts)
    .leftJoin(generations, eq(parts.generationsId, generations.id))
    .leftJoin(usersToParts, eq(usersToParts.partId, parts.id))
    .where(
      scope?.kind === 'generation'
        ? eq(parts.generationsId, scope.generationId)
        : undefined
    )
    .groupBy(parts.id, generations.id)
    .orderBy(
      desc(parts.generationsId),
      asc(parts.displayOrder),
      asc(parts.createdAt)
    )
}
