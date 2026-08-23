import 'server-only'

import { cache } from 'react'
import db from '@/db'
import { generations } from '@/db/schema/generations'
import type { Locale } from '@/i18n-config'
import {
  cacheQuery,
  forEachPublicLocale,
  generationLatestTag,
  generationListTag,
} from '@/lib/server/cache'
import { publicCachePolicy } from '@/lib/server/cache/policy'
import { asc, desc } from 'drizzle-orm'

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

export function getGenerationSummaries(_locale: Locale) {
  void _locale
  return getGenerationSummariesForRequest()
}

async function getSharedLatestGeneration() {
  'use cache: remote'

  cacheQuery(
    publicCachePolicy.generationIndex,
    forEachPublicLocale((locale) => [generationLatestTag(locale)])
  )

  return db.query.generations.findFirst({
    columns: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
    },
    orderBy: desc(generations.startDate),
  })
}

const getLatestGenerationForRequest = cache(() => getSharedLatestGeneration())

export function getLatestGeneration(_locale: Locale) {
  void _locale
  return getLatestGenerationForRequest()
}
