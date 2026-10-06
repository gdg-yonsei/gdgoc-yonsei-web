// 기록은 1시간 visibilityBucket까지 끝난 세션만 공개한다. 캘린더는 예정 세션도 포함한다.
// 두 언어 필드를 한 공유 캐시에 담되 두 언어 태그를 모두 붙이고 요청 내 중복 호출은 합친다.
import 'server-only'

import { cache } from 'react'
import { db } from '@/db'
import { generations } from '@/db/schema/generations'
import { parts } from '@/db/schema/parts'
import { sessions } from '@/db/schema/sessions'
import {
  cacheQuery,
  forEachPublicLocale,
  generationListTag,
  sessionGenerationTag,
  sessionListTag,
  sessionDetailsTag,
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

  // 기수 페이지도 이 항목을 읽으므로, 관리자가 기수 페이지를 위해 즉시 무효화하는
  // 태그에도 반응하도록 결과에 나온 기수마다 태그를 단다(lib/server/cache/invalidation.ts).
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

export function getSessionArchive(visibilityBucket: string) {
  return getSessionArchiveForRequest(visibilityBucket)
}

async function getSharedCalendarSessions(): Promise<CalendarSession[]> {
  'use cache: remote'

  cacheQuery(
    publicCachePolicy.sessionList,
    forEachPublicLocale((locale) => [sessionListTag(locale)])
  )

  // 세션 기록과 달리 캘린더는 열리기 전 세션도 보여 주므로 종료 시각 조건이 없다.
  // 대신 캘린더 칸에 보이는 필드만 읽어, 설명과 이미지는 세션이 끝날 때까지 공개하지 않는다.
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

/** 일정이 정해진 모든 공개 세션(예정 포함). 캘린더 전용. */
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

export function getPublishedSessionsForSitemap(visibilityBucket: string) {
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
    forEachPublicLocale((locale) => [
      sessionTag(sessionId, locale),
      sessionDetailsTag(locale),
    ])
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

/** 공개된 세션 상세. UUID가 아니거나 아직 끝나지 않았거나 비공개면 `undefined`. */
export function getSessionById(sessionId: string, visibilityBucket: string) {
  if (!isUuid(sessionId)) {
    return Promise.resolve(undefined)
  }

  return getSessionByIdForRequest(sessionId, visibilityBucket)
}
