import 'server-only'

import db from '@/db'
import { generations } from '@/db/schema/generations'
import type { Locale } from '@/i18n-config'
import { cacheQuery, generationLatestTag, generationListTag } from '@/lib/server/cache'
import { publicCachePolicy } from '@/lib/server/cache/policy'
import { asc, desc } from 'drizzle-orm'

export async function getGenerationSummaries(locale: Locale) {
  'use cache: remote'

  cacheQuery(publicCachePolicy.generationIndex, [generationListTag(locale)])

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

export async function getLatestGeneration(locale: Locale) {
  'use cache: remote'

  cacheQuery(publicCachePolicy.generationIndex, [generationLatestTag(locale)])

  return db.query.generations.findFirst({
    orderBy: desc(generations.startDate),
  })
}
