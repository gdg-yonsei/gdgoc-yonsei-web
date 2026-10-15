/** 실시간 카드. 최근 5분 안에 조회가 있었던 방문자를 활성으로 본다(GA4 실시간은 30분이지만 동아리 규모에서는 5분이 더 생생하다). */
import 'server-only'

import { sql } from 'drizzle-orm'
import {
  selectRows,
  timestampParam,
  type QueryExecutor,
} from '@/lib/server/analytics/queries/sql'

export type RealtimeSnapshot = {
  activeVisitors: number
  perMinute: Array<{ minutesAgo: number; views: number }>
  activePages: Array<{ path: string; visitors: number }>
}

const MINUTE_MS = 60_000

export async function getRealtime(
  executor: QueryExecutor,
  input: { now: Date; includeInternal: boolean }
): Promise<RealtimeSnapshot> {
  const fiveMinutesAgo = new Date(input.now.getTime() - 5 * MINUTE_MS)
  const thirtyMinutesAgo = new Date(input.now.getTime() - 30 * MINUTE_MS)
  const internal = input.includeInternal ? sql`TRUE` : sql`NOT s."isInternal"`

  const [active] = await selectRows<{ visitors: number }>(
    executor,
    sql`
      SELECT count(DISTINCT v."visitorId")::int AS visitors
      FROM analytics_page_views v JOIN analytics_sessions s ON s.id = v."sessionId"
      WHERE v."occurredAt" >= ${timestampParam(fiveMinutesAgo)} AND ${internal}
    `
  )
  // 방문자마다 가장 최근에 본 페이지만 센다.
  const pages = await selectRows<{ path: string; visitors: number }>(
    executor,
    sql`
      SELECT latest.path, count(*)::int AS visitors FROM (
        SELECT DISTINCT ON (v."visitorId") v.path
        FROM analytics_page_views v JOIN analytics_sessions s ON s.id = v."sessionId"
        WHERE v."occurredAt" >= ${timestampParam(fiveMinutesAgo)} AND ${internal}
        ORDER BY v."visitorId", v."occurredAt" DESC
      ) latest
      GROUP BY 1 ORDER BY visitors DESC, 1 LIMIT 5
    `
  )
  const minutes = await selectRows<{ minutes_ago: number; views: number }>(
    executor,
    sql`
      SELECT floor(extract(epoch from (${timestampParam(input.now)} - v."occurredAt")) / 60)::int AS minutes_ago,
        count(*)::int AS views
      FROM analytics_page_views v JOIN analytics_sessions s ON s.id = v."sessionId"
      WHERE v."occurredAt" >= ${timestampParam(thirtyMinutesAgo)} AND ${internal}
      GROUP BY 1
    `
  )

  const byMinute = new Map(
    minutes.map((row) => [Number(row.minutes_ago), Number(row.views)])
  )
  return {
    activeVisitors: Number(active?.visitors ?? 0),
    perMinute: Array.from({ length: 30 }, (_, index) => {
      const minutesAgo = 29 - index
      return { minutesAgo, views: byMinute.get(minutesAgo) ?? 0 }
    }),
    activePages: pages.map((row) => ({
      path: row.path,
      visitors: Number(row.visitors),
    })),
  }
}
