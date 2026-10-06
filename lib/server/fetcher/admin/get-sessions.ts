// 권한·기수별 조회는 공유 캐시하지 않는다. 호출부가 권한을 먼저 확인해야 한다.
import 'server-only'

import { cache } from 'react'
import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { generations } from '@/db/schema/generations'
import { parts } from '@/db/schema/parts'
import { sessions } from '@/db/schema/sessions'
import { userToSession } from '@/db/schema/user-to-session'
import { type AdminGenerationScope } from '@/lib/server/admin-generation-scope'

export type AdminSessionListItem = {
  id: string
  name: string
  nameKo: string
  mainImage: string
  startAt: Date | null
  endAt: Date | null
  internalOpen: boolean | null
  publicOpen: boolean | null
  maxCapacity: number | null
  participantCount: number
  partId: number | null
  partName: string | null
  generationId: number | null
  generationName: string | null
}

export const getSessions = cache(
  async (scope?: AdminGenerationScope | null) => {
    return db
      .select({
        id: sessions.id,
        name: sessions.name,
        nameKo: sessions.nameKo,
        mainImage: sessions.mainImage,
        startAt: sessions.startAt,
        endAt: sessions.endAt,
        internalOpen: sessions.internalOpen,
        publicOpen: sessions.publicOpen,
        maxCapacity: sessions.maxCapacity,
        participantCount: sql<number>`(select count(*)::int from ${userToSession} where ${userToSession.sessionId} = ${sessions.id})`,
        partId: sessions.partId,
        partName: parts.name,
        generationId: generations.id,
        generationName: generations.name,
      })
      .from(sessions)
      .leftJoin(parts, eq(sessions.partId, parts.id))
      .leftJoin(generations, eq(parts.generationsId, generations.id))
      .where(
        scope?.kind === 'generation'
          ? and(eq(parts.generationsId, scope.generationId))
          : undefined
      )
      .orderBy(desc(sessions.startAt), desc(sessions.createdAt))
  }
)
