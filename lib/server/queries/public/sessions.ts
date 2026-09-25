import 'server-only'

import { cache } from 'react'
import db from '@/db'
import { generations } from '@/db/schema/generations'
import { parts } from '@/db/schema/parts'
import { sessions } from '@/db/schema/sessions'
import type { Locale } from '@/i18n-config'
import {
  cacheQuery,
  forEachPublicLocale,
  generationListTag,
  sessionGenerationTag,
  sessionListTag,
  sessionTag,
  tagQuery,
  uniqueStrings,
} from '@/lib/server/cache'
import type { CalendarSession } from '@/lib/site/calendar'
import type { LogSession } from '@/lib/site/session-log'
import { publicCachePolicy } from '@/lib/server/cache/policy'
import { isUuid } from '@/lib/server/queries/public/uuid'
import { and, asc, desc, eq, isNotNull, lte } from 'drizzle-orm'

function toVisibilityDate(visibilityBucket: string): Date {
  return new Date(visibilityBucket)
}

async function getSharedSessions(visibilityBucket: string) {
  'use cache: remote'

  cacheQuery(
    publicCachePolicy.sessionList,
    forEachPublicLocale((locale) => [sessionListTag(locale)])
  )

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

const getSessionsForRequest = cache((visibilityBucket: string) =>
  getSharedSessions(visibilityBucket)
)

export function getSessions(_locale: Locale, visibilityBucket: string) {
  return getSessionsForRequest(visibilityBucket)
}

async function getSharedSessionArchive(
  visibilityBucket: string
): Promise<LogSession[]> {
  'use cache: remote'

  cacheQuery(
    publicCachePolicy.sessionList,
    forEachPublicLocale((locale) => [sessionListTag(locale)])
  )

  const rows = await db
    .select({
      id: sessions.id,
      name: sessions.name,
      nameKo: sessions.nameKo,
      category: sessions.category,
      type: sessions.type,
      mainImage: sessions.mainImage,
      startAt: sessions.startAt,
      endAt: sessions.endAt,
      location: sessions.location,
      locationKo: sessions.locationKo,
      createdAt: sessions.createdAt,
      updatedAt: sessions.updatedAt,
      partName: parts.name,
      generationName: generations.name,
      generationStartDate: generations.startDate,
    })
    .from(sessions)
    .innerJoin(parts, eq(sessions.partId, parts.id))
    .innerJoin(generations, eq(parts.generationsId, generations.id))
    .where(
      and(
        eq(sessions.displayOnWebsite, true),
        lte(sessions.endAt, toVisibilityDate(visibilityBucket))
      )
    )
    .orderBy(desc(sessions.startAt))

  // Generation pages read this entry too, so it answers to the tags the admin
  // invalidates immediately for them (lib/server/cache/invalidation.ts).
  const generationNames = uniqueStrings(rows.map((row) => row.generationName))
  tagQuery(
    forEachPublicLocale((locale) => [
      generationListTag(locale),
      ...generationNames.map((name) => sessionGenerationTag(name, locale)),
    ])
  )

  return rows
}

const getSessionArchiveForRequest = cache((visibilityBucket: string) =>
  getSharedSessionArchive(visibilityBucket)
)

/** Every public session, bilingual, for hubs, generation pages and counters. */
export function getSessionArchive(visibilityBucket: string) {
  return getSessionArchiveForRequest(visibilityBucket)
}

async function getSharedCalendarSessions(): Promise<CalendarSession[]> {
  'use cache: remote'

  cacheQuery(
    publicCachePolicy.sessionList,
    forEachPublicLocale((locale) => [sessionListTag(locale)])
  )

  // Unlike the archive, the calendar lists sessions before they happen, so
  // there is no end-time cut-off here. Only the fields a calendar entry shows
  // are read; descriptions and images stay unpublished until the session ends.
  const rows = await db
    .select({
      id: sessions.id,
      name: sessions.name,
      nameKo: sessions.nameKo,
      category: sessions.category,
      startAt: sessions.startAt,
      endAt: sessions.endAt,
      location: sessions.location,
      locationKo: sessions.locationKo,
      partName: parts.name,
      generationName: generations.name,
    })
    .from(sessions)
    .innerJoin(parts, eq(sessions.partId, parts.id))
    .innerJoin(generations, eq(parts.generationsId, generations.id))
    .where(
      and(eq(sessions.displayOnWebsite, true), isNotNull(sessions.startAt))
    )
    .orderBy(asc(sessions.startAt))

  const generationNames = uniqueStrings(rows.map((row) => row.generationName))
  tagQuery(
    forEachPublicLocale((locale) => [
      generationListTag(locale),
      ...generationNames.map((name) => sessionGenerationTag(name, locale)),
    ])
  )

  return rows.flatMap((row) =>
    row.startAt ? [{ ...row, startAt: row.startAt }] : []
  )
}

/** Every dated public session, scheduled ones included, for the calendar. */
export const getCalendarSessions = cache(() => getSharedCalendarSessions())

const getPublishedSessionsForSitemapForRequest = cache(
  (visibilityBucket: string) =>
    getSharedPublishedSessionsForSitemap(visibilityBucket)
)

async function getSharedPublishedSessionsForSitemap(visibilityBucket: string) {
  'use cache: remote'

  cacheQuery(
    publicCachePolicy.sitemap,
    forEachPublicLocale((locale) => [sessionListTag(locale)])
  )

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

export function getPublishedSessionsForSitemap(
  _locale: Locale,
  visibilityBucket: string
) {
  return getPublishedSessionsForSitemapForRequest(visibilityBucket)
}

const getSessionByIdForRequest = cache(
  (sessionId: string, visibilityBucket: string) =>
    getSharedSessionById(sessionId, visibilityBucket)
)

async function getSharedSessionById(
  sessionId: string,
  visibilityBucket: string
) {
  'use cache: remote'

  cacheQuery(
    publicCachePolicy.sessionDetail,
    forEachPublicLocale((locale) => [sessionTag(sessionId, locale)])
  )

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
      category: true,
      description: true,
      descriptionKo: true,
      mainImage: true,
      images: true,
      startAt: true,
      endAt: true,
      location: true,
      locationKo: true,
      type: true,
      createdAt: true,
      updatedAt: true,
    },
    with: {
      part: {
        columns: {
          id: true,
          name: true,
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
  })
}

export function getSessionById(
  sessionId: string,
  _locale: Locale,
  visibilityBucket: string
) {
  if (!isUuid(sessionId)) {
    return Promise.resolve(undefined)
  }

  return getSessionByIdForRequest(sessionId, visibilityBucket)
}
