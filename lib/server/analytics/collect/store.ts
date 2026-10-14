/**
 * 검증된 배치를 한 트랜잭션으로 저장한다. 조회를 먼저 넣고, 나머지 이벤트는 DB에 있는 조회에만 붙인다.
 * 비콘은 유실·중복될 수 있으므로 없는 조회의 이벤트는 건너뛰고, 같은 조회는 한 번만 넣는다.
 */
import 'server-only'

import { eq, inArray, sql } from 'drizzle-orm'
import { db, type Transaction } from '@/db'
import {
  analyticsEvents,
  analyticsPageViews,
  analyticsSessions,
} from '@/db/schema/analytics'
import { MAX_EVENT_AGE_MS } from '@/lib/analytics/constants'
import { classifyChannel } from '@/lib/server/analytics/collect/channel'
import {
  localeFromPath,
  normalizePath,
  parseReferrer,
} from '@/lib/server/analytics/collect/normalize'
import type {
  ParsedAnalyticsEvent,
  ParsedPageView,
} from '@/lib/server/analytics/collect/schema'
import { countryFromTimezone } from '@/lib/server/analytics/collect/timezone-country'
import type { ParsedUserAgent } from '@/lib/server/analytics/collect/user-agent'

/** 요청 단위 값. `resolveIsInternal`은 새 세션을 만들 때만 불러 로그인 확인 쿼리를 아낀다. */
export type CollectContext = {
  now: Date
  siteHost: string
  userAgent: ParsedUserAgent
  resolveIsInternal: () => Promise<boolean>
}

function occurredAt(now: Date, ageMs: number) {
  return new Date(now.getTime() - Math.min(ageMs, MAX_EVENT_AGE_MS))
}

// 드라이버마다 Date 직렬화가 달라 raw SQL에는 ISO 문자열을 timestamp로 캐스팅해 넘긴다.
function timestampParam(date: Date) {
  return sql`${date.toISOString()}::timestamp`
}

async function storePageView(
  tx: Transaction,
  event: ParsedPageView,
  context: CollectContext
) {
  const at = occurredAt(context.now, event.ageMs)
  const path = normalizePath(event.path)

  const [existing] = await tx
    .select({ id: analyticsSessions.id })
    .from(analyticsSessions)
    .where(eq(analyticsSessions.id, event.sessionId))
    .limit(1)

  if (existing) {
    await tx
      .update(analyticsSessions)
      .set({
        lastSeenAt: sql`GREATEST(${analyticsSessions.lastSeenAt}, ${timestampParam(at)})`,
      })
      .where(eq(analyticsSessions.id, event.sessionId))
  } else {
    const referrer = parseReferrer(event.referrer, context.siteHost)
    const utm = event.utm ?? {}
    await tx
      .insert(analyticsSessions)
      .values({
        id: event.sessionId,
        visitorId: event.visitorId,
        startedAt: at,
        lastSeenAt: at,
        isNewVisitor: event.isNewVisitor,
        isInternal: await context.resolveIsInternal(),
        landingPath: path,
        referrerHost: referrer?.host ?? null,
        referrerPath: referrer?.path ?? null,
        utmSource: utm.source ?? null,
        utmMedium: utm.medium ?? null,
        utmCampaign: utm.campaign ?? null,
        utmTerm: utm.term ?? null,
        utmContent: utm.content ?? null,
        channel: classifyChannel({
          referrerHost: referrer?.host ?? null,
          utmSource: utm.source,
          utmMedium: utm.medium,
          hasUtm: Object.keys(utm).length > 0,
        }),
        deviceType: context.userAgent.deviceType,
        browser: context.userAgent.browser,
        os: context.userAgent.os,
        screenWidth: event.screenWidth ?? null,
        screenHeight: event.screenHeight ?? null,
        language: event.language ?? null,
        timezone: event.timezone ?? null,
        country: countryFromTimezone(event.timezone),
      })
      // 같은 세션의 첫 비콘 두 개가 동시에 오면 나중 것은 마지막 활동 시각만 갱신한다.
      .onConflictDoUpdate({
        target: analyticsSessions.id,
        set: {
          lastSeenAt: sql`GREATEST(${analyticsSessions.lastSeenAt}, excluded."lastSeenAt")`,
        },
      })
  }

  await tx
    .insert(analyticsPageViews)
    .values({
      id: event.pageViewId,
      sessionId: event.sessionId,
      visitorId: event.visitorId,
      occurredAt: at,
      sequence: event.sequence,
      path,
      locale: localeFromPath(path),
      title: event.title ?? null,
      isNotFound: event.isNotFound,
    })
    .onConflictDoNothing({ target: analyticsPageViews.id })
}

/** 저장 실패는 호출자(수집 핸들러)가 로그로 남긴다. 부분 저장 없이 배치 전체가 롤백된다. */
export async function storeAnalyticsBatch(
  events: ParsedAnalyticsEvent[],
  context: CollectContext
): Promise<void> {
  await db.transaction(async (tx) => {
    for (const event of events) {
      if (event.type === 'page_view') await storePageView(tx, event, context)
    }

    const others = events.filter((event) => event.type !== 'page_view')
    if (others.length === 0) return

    // 세션은 클라이언트 값 대신 DB의 조회 행에서 가져온다.
    const known = await tx
      .select({
        id: analyticsPageViews.id,
        sessionId: analyticsPageViews.sessionId,
      })
      .from(analyticsPageViews)
      .where(
        inArray(analyticsPageViews.id, [
          ...new Set(others.map((event) => event.pageViewId)),
        ])
      )
    const sessionByPageView = new Map(
      known.map((row) => [row.id, row.sessionId])
    )
    const lastSeenBySession = new Map<string, Date>()

    for (const event of others) {
      const sessionId = sessionByPageView.get(event.pageViewId)
      if (!sessionId) continue
      const at = occurredAt(context.now, event.ageMs)

      if (event.type === 'engagement') {
        await tx
          .update(analyticsPageViews)
          .set({
            engagementMs: sql`GREATEST(${analyticsPageViews.engagementMs}, ${event.engagementMs})`,
            maxScrollPercent: sql`GREATEST(${analyticsPageViews.maxScrollPercent}, ${event.maxScrollPercent})`,
          })
          .where(eq(analyticsPageViews.id, event.pageViewId))
      } else if (event.type === 'click') {
        await tx.insert(analyticsEvents).values({
          sessionId,
          pageViewId: event.pageViewId,
          occurredAt: at,
          name: event.kind,
          path: normalizePath(event.path),
          label: event.label ?? null,
          targetUrl: event.targetUrl ?? null,
        })
      } else {
        await tx.insert(analyticsEvents).values({
          sessionId,
          pageViewId: event.pageViewId,
          occurredAt: at,
          name: 'web_vital',
          path: normalizePath(event.path),
          metric: event.metric,
          rating: event.rating,
          value: event.value,
        })
      }

      const previous = lastSeenBySession.get(sessionId)
      if (!previous || previous < at) lastSeenBySession.set(sessionId, at)
    }

    for (const [sessionId, at] of lastSeenBySession) {
      await tx
        .update(analyticsSessions)
        .set({
          lastSeenAt: sql`GREATEST(${analyticsSessions.lastSeenAt}, ${timestampParam(at)})`,
        })
        .where(eq(analyticsSessions.id, sessionId))
    }
  })
}
