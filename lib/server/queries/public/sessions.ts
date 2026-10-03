/**
 * 공개 세션 기록·캘린더 조회.
 *
 * "끝난 세션만 공개"가 원칙이다. 현재 시각 대신 1시간 단위 공개 버킷(`visibilityBucket`)을
 * 받아 그 시각까지 끝난 세션만 돌려주므로, 같은 시간대의 요청이 캐시를 공유한다
 * (`lib/server/cache/session-visibility.ts`). 캘린더만 예정 세션까지 보여 준다.
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

/** 공개 버킷 문자열을 비교용 Date로 바꾼다. */
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

/** 공개된 모든 세션(두 언어 필드 포함). 허브, 기수 페이지, 개수 표시가 함께 쓴다. */
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

/** 사이트맵·정적 파라미터용으로 공개된 세션의 ID와 기수 이름만 읽는다. */
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
