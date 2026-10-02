/**
 * 공개 구성원 디렉터리 조회.
 *
 * 공개 사이트 조회는 모두 같은 구조다.
 * - `getShared*`: `'use cache: remote'` 함수. 결과를 Redis(또는 메모리)에 공유 캐시한다.
 *   행에 영어·한국어 필드가 모두 있으므로 언어와 무관하게 캐시 항목 하나를 쓰고, 기존 무효화
 *   규칙을 지키려고 두 언어의 태그를 모두 단다.
 * - `get*ForRequest`: React `cache()`로 같은 요청 안의 중복 호출을 합친다.
 * - 공개 함수(`get*`): 입력 검증(UUID 등) 후 위 함수를 부른다.
 */
import 'server-only'

import { cache } from 'react'
import { db } from '@/db'
import { generations } from '@/db/schema/generations'
import { parts } from '@/db/schema/parts'
import { usersToParts } from '@/db/schema/users-to-parts'
import {
  cacheQuery,
  forEachPublicLocale,
  memberGenerationTag,
  memberListTag,
} from '@/lib/server/cache'
import { publicCachePolicy } from '@/lib/server/cache/policy'
import { asc, eq, sql } from 'drizzle-orm'

async function getSharedMembersByGeneration(generationName: string) {
  'use cache: remote'

  cacheQuery(
    publicCachePolicy.memberDirectory,
    forEachPublicLocale((locale) => [
      memberListTag(locale),
      memberGenerationTag(generationName, locale),
    ])
  )

  return db.query.generations.findFirst({
    where: eq(generations.name, generationName),
    columns: {
      id: true,
      name: true,
    },
    with: {
      parts: {
        columns: {
          id: true,
          name: true,
        },
        with: {
          usersToParts: {
            columns: {
              userId: true,
            },
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                  firstName: true,
                  firstNameKo: true,
                  lastName: true,
                  lastNameKo: true,
                  githubId: true,
                  instagramId: true,
                  linkedInId: true,
                  isForeigner: true,
                },
              },
            },
            // 관리자 역할(user.role)이 아니라 이 파트 안에서의 역할 순서로 정렬한다.
            orderBy: [
              asc(sql`case ${usersToParts.userType}
                when 'Core' then 0
                when 'Primary' then 1
                when 'Secondary' then 2
                else 3
              end`),
              asc(usersToParts.userId),
            ],
          },
        },
        orderBy: [asc(parts.displayOrder), asc(parts.id)],
      },
    },
  })
}

const getMembersByGenerationForRequest = cache((generationName: string) =>
  getSharedMembersByGeneration(generationName)
)

/** 기수 하나의 파트와 구성원(파트장 → 주 소속 → 겸임 순)을 돌려준다. 없는 기수면 `undefined`. */
export function getMembersByGeneration(generationName: string) {
  return getMembersByGenerationForRequest(generationName)
}
