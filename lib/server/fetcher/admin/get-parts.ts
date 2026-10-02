/**
 * 관리자 파트 목록 조회.
 *
 * 캐시하지 않는 관리자 조회다(권한·기수 범위에 따라 결과가 달라 공유 캐시를 쓰지 않는다).
 * 권한 확인은 호출부(레이아웃 가드, 서비스)가 먼저 한다.
 */
import 'server-only'

import { cache } from 'react'
import { asc, count, desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { generations } from '@/db/schema/generations'
import { parts } from '@/db/schema/parts'
import { usersToParts } from '@/db/schema/users-to-parts'
import { type AdminGenerationScope } from '@/lib/server/admin-generation-scope'

/** 파트 목록의 한 행(구성원 수 포함). */
export type AdminPartListItem = {
  id: number
  name: string
  description: string | null
  displayOrder: number
  memberCount: number
  generationId: number | null
  generationName: string | null
}

/** 범위의 파트를 구성원 수와 함께 읽는다. 요청 단위로 메모이즈한다. */
export const getParts = cache(async (scope?: AdminGenerationScope | null) => {
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
    .orderBy(desc(parts.generationsId), asc(parts.displayOrder), asc(parts.id))
})
