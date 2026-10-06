// 권한·기수별 조회는 공유 캐시하지 않는다. 호출부가 권한을 먼저 확인해야 한다.
import 'server-only'

import { cache } from 'react'
import { and, asc, desc, eq, ne, sql } from 'drizzle-orm'
import { db } from '@/db'
import { generations } from '@/db/schema/generations'
import { parts } from '@/db/schema/parts'
import { users } from '@/db/schema/users'
import { usersToParts } from '@/db/schema/users-to-parts'
import { type AdminGenerationScope } from '@/lib/server/admin-generation-scope'

/** 멤버 목록의 한 행. 멤버가 여러 기수에 속하면 기수마다 한 행씩 나온다. */
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

/** 한 기수 안에 소속이 여럿이면 주 소속(Primary) 파트를 대표로 고른다. */
const membershipPriority = sql<number>`
  CASE
    WHEN ${usersToParts.userType} = 'Primary' THEN 0
    ELSE 1
  END
`

// 승인 멤버는 (멤버, 기수)마다 한 행이다. 선택 기수 소속만 또는 전체 기수를 반환한다.
// 정렬은 최신 기수, 파트 이름, 이름 순이다.
export const getMembers = cache(async (scope?: AdminGenerationScope | null) => {
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
    .from(users)
    .leftJoin(usersToParts, eq(users.id, usersToParts.userId))
    .leftJoin(parts, eq(usersToParts.partId, parts.id))
    .leftJoin(generations, eq(parts.generationsId, generations.id))
    .where(
      scope?.kind === 'generation'
        ? and(
            ne(users.role, 'UNVERIFIED'),
            eq(generations.id, scope.generationId)
          )
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
    const generationDifference =
      (right.generationId ?? 0) - (left.generationId ?? 0)
    if (generationDifference !== 0) {
      return generationDifference
    }

    const partName = (left.part ?? '').localeCompare(right.part ?? '')
    if (partName !== 0) {
      return partName
    }

    return (left.name ?? '').localeCompare(right.name ?? '')
  })
})
