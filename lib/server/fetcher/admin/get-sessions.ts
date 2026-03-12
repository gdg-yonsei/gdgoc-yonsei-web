import 'server-only'

import { unstable_noStore as noStore } from 'next/cache'
import { and, desc, eq } from 'drizzle-orm'
import db from '@/db'
import { generations } from '@/db/schema/generations'
import { parts } from '@/db/schema/parts'
import { sessions } from '@/db/schema/sessions'
import { type AdminGenerationScope } from '@/lib/server/admin-generation-scope'

export type AdminSessionListItem = {
  id: string
  name: string
  nameKo: string
  mainImage: string
  startAt: Date | null
  endAt: Date | null
  partId: number
  partName: string
  generationId: number | null
  generationName: string | null
}

export const preloadAdminSessions = (scope?: AdminGenerationScope | null) => {
  void getSessions(scope)
}

export async function getSessions(scope?: AdminGenerationScope | null) {
  noStore()

  return db
    .select({
      id: sessions.id,
      name: sessions.name,
      nameKo: sessions.nameKo,
      mainImage: sessions.mainImage,
      startAt: sessions.startAt,
      endAt: sessions.endAt,
      partId: sessions.partId,
      partName: parts.name,
      generationId: generations.id,
      generationName: generations.name,
    })
    .from(sessions)
    .innerJoin(parts, eq(sessions.partId, parts.id))
    .leftJoin(generations, eq(parts.generationsId, generations.id))
    .where(
      scope?.kind === 'generation'
        ? and(eq(parts.generationsId, scope.generationId))
        : undefined
    )
    .orderBy(desc(sessions.startAt), desc(sessions.createdAt))
}
