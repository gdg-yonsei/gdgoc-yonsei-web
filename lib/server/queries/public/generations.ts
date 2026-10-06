// 두 언어 필드를 한 공유 캐시에 담고 두 언어 태그를 모두 붙인다. React cache는 요청 내 중복만 합친다.
import 'server-only'

import { cache } from 'react'
import { db } from '@/db'
import { generations } from '@/db/schema/generations'
import {
  cacheQuery,
  forEachPublicLocale,
  generationListTag,
} from '@/lib/server/cache'
import { publicCachePolicy } from '@/lib/server/cache/policy'
import { asc } from 'drizzle-orm'

async function getSharedGenerationSummaries() {
  'use cache: remote'

  cacheQuery(
    publicCachePolicy.generationIndex,
    forEachPublicLocale((locale) => [generationListTag(locale)])
  )

  return db
    .select({
      id: generations.id,
      name: generations.name,
      startDate: generations.startDate,
      endDate: generations.endDate,
    })
    .from(generations)
    .orderBy(asc(generations.startDate))
}

const getGenerationSummariesForRequest = cache(() =>
  getSharedGenerationSummaries()
)

export function getGenerationSummaries() {
  return getGenerationSummariesForRequest()
}
