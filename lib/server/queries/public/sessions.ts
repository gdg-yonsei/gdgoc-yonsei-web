import 'server-only'

import db from '@/db'
import { generations } from '@/db/schema/generations'
import { parts } from '@/db/schema/parts'
import { sessions } from '@/db/schema/sessions'
import type { Locale } from '@/i18n-config'
import {
  cacheQuery,
  sessionGenerationTag,
  sessionListTag,
  sessionTag,
} from '@/lib/server/cache'
import { publicCachePolicy } from '@/lib/server/cache/policy'
import { and, desc, eq, lte } from 'drizzle-orm'

function toVisibilityDate(visibilityBucket: string): Date {
  return new Date(visibilityBucket)
}

export async function getSessions(locale: Locale, visibilityBucket: string) {
  'use cache: remote'

  cacheQuery(publicCachePolicy.sessionList, [sessionListTag(locale)])

  return db.query.sessions.findMany({
    columns: {
      id: true,
      name: true,
      nameKo: true,
      mainImage: true,
      startAt: true,
      endAt: true,
      createdAt: true,
      updatedAt: true,
    },
    with: {
      part: {
        columns: {
          id: true,
          name: true,
          generationsId: true,
        },
        with: {
          generation: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    where: lte(sessions.endAt, toVisibilityDate(visibilityBucket)),
  })
}

export async function getPublishedSessionsByGeneration(
  generationName: string,
  locale: Locale,
  visibilityBucket: string
) {
  'use cache: remote'

  cacheQuery(publicCachePolicy.sessionList, [
    sessionListTag(locale),
    sessionGenerationTag(generationName, locale),
  ])

  return db
    .select({
      id: sessions.id,
      name: sessions.name,
      nameKo: sessions.nameKo,
      mainImage: sessions.mainImage,
      startAt: sessions.startAt,
      createdAt: sessions.createdAt,
      updatedAt: sessions.updatedAt,
    })
    .from(sessions)
    .leftJoin(parts, eq(sessions.partId, parts.id))
    .leftJoin(generations, eq(generations.id, parts.generationsId))
    .where(
      and(
        eq(generations.name, generationName),
        eq(sessions.displayOnWebsite, true),
        lte(sessions.endAt, toVisibilityDate(visibilityBucket))
      )
    )
    .orderBy(desc(sessions.endAt))
}

export async function getPublishedSessionsForSitemap(
  locale: Locale,
  visibilityBucket: string
) {
  'use cache: remote'

  cacheQuery(publicCachePolicy.sitemap, [sessionListTag(locale)])

  return db
    .select({
      id: sessions.id,
      generationName: generations.name,
      createdAt: sessions.createdAt,
      updatedAt: sessions.updatedAt,
    })
    .from(sessions)
    .leftJoin(parts, eq(sessions.partId, parts.id))
    .leftJoin(generations, eq(generations.id, parts.generationsId))
    .where(
      and(
        eq(sessions.displayOnWebsite, true),
        lte(sessions.endAt, toVisibilityDate(visibilityBucket))
      )
    )
    .orderBy(desc(sessions.endAt))
}

export async function getSessionById(
  sessionId: string,
  locale: Locale,
  visibilityBucket: string
) {
  'use cache: remote'

  cacheQuery(publicCachePolicy.sessionDetail, [sessionTag(sessionId, locale)])

  return db.query.sessions.findFirst({
    where: and(
      eq(sessions.id, sessionId),
      lte(sessions.endAt, toVisibilityDate(visibilityBucket)),
      eq(sessions.displayOnWebsite, true)
    ),
    columns: {
      id: true,
      name: true,
      nameKo: true,
      description: true,
      descriptionKo: true,
      mainImage: true,
      images: true,
      startAt: true,
      endAt: true,
      location: true,
      locationKo: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}
