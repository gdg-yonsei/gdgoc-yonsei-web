// 두 언어 필드를 한 공유 캐시에 담고 두 언어 태그를 모두 붙인다. React cache는 요청 내 중복만 합친다.
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
