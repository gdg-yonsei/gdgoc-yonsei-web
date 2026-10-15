/**
 * 페이지 단위 보고서. 조회는 발생 시각으로 기간에 넣는다. 종료(exit)는 세션의 마지막 조회, 방문 시작은 sequence 1이다.
 * 제목은 마지막으로 수집된 문서 제목에서 사이트 접미사를 뗀 값이다.
 */
import 'server-only'

import { sql, type SQL } from 'drizzle-orm'
import {
  contentGroupOf,
  type ContentGroup,
} from '@/lib/analytics/content-groups'
import type { TimeBucket } from '@/lib/analytics/date-range'
import type { AnalyticsFilter } from '@/lib/analytics/filters'
import {
  bucketSql,
  pageConditions,
  selectRows,
  sessionConditions,
  timestampParam,
  whereAll,
  type QueryExecutor,
} from '@/lib/server/analytics/queries/sql'

export const ENTRANCE_MARKER = '(entrance)'
export const EXIT_MARKER = '(exit)'

const TITLE_SUFFIX = / \| GDGoC Yonsei$/

type RangeInput = { filter: AnalyticsFilter; start: Date; end: Date }

export type PageRow = {
  path: string
  title: string | null
  contentGroup: ContentGroup
  views: number
  users: number
  avgEngagementSeconds: number
  scroll75Rate: number
  entrances: number
  exits: number
  exitRate: number
}

export type PageFlowRow = { path: string; views: number }

export type PageDetail = {
  totals: Omit<PageRow, 'path' | 'title' | 'contentGroup'>
  series: Array<{ bucket: string; views: number }>
  scrollDepth: Array<{ threshold: number; rate: number }>
  previousPages: PageFlowRow[]
  nextPages: PageFlowRow[]
  channels: Array<{ channel: string; views: number }>
}

export type EventRow = {
  name: string
  label: string
  count: number
  sessions: number
}
export type NotFoundRow = { path: string; views: number; referrer: string }

/** 기간·세션·페이지 필터를 건 조회 집합(별칭 v, s)과 세션 안 마지막 순번(last_sequence). */
function filteredViews(input: RangeInput, extra: SQL[] = []): SQL {
  const conditions = [
    sql`v."occurredAt" >= ${timestampParam(input.start)}`,
    sql`v."occurredAt" < ${timestampParam(input.end)}`,
    ...sessionConditions(input.filter, 's'),
    ...pageConditions(input.filter, 'v'),
    ...extra,
  ]
  return sql`
    fv AS (
      SELECT v.*, s.channel, s."referrerHost",
        (SELECT max(sequence) FROM analytics_page_views lv WHERE lv."sessionId" = v."sessionId") AS last_sequence
      FROM analytics_page_views v
      JOIN analytics_sessions s ON s.id = v."sessionId"
      WHERE ${whereAll(conditions)}
    )`
}

type PageAggregate = {
  views: number
  users: number
  engagement_ms: number
  scroll75: number
  entrances: number
  exits: number
}

const PAGE_AGGREGATES = sql`
  count(*)::int AS views,
  count(DISTINCT fv."visitorId")::int AS users,
  coalesce(sum(fv."engagementMs"), 0)::float8 AS engagement_ms,
  count(*) FILTER (WHERE fv."maxScrollPercent" >= 75)::int AS scroll75,
  count(*) FILTER (WHERE fv.sequence = 1)::int AS entrances,
  count(*) FILTER (WHERE fv.sequence = fv.last_sequence)::int AS exits`

function toTotals(row: PageAggregate | undefined): PageDetail['totals'] {
  const views = Number(row?.views ?? 0)
  const exits = Number(row?.exits ?? 0)
  return {
    views,
    users: Number(row?.users ?? 0),
    avgEngagementSeconds:
      views > 0 ? Number(row?.engagement_ms ?? 0) / views / 1000 : 0,
    scroll75Rate: views > 0 ? Number(row?.scroll75 ?? 0) / views : 0,
    entrances: Number(row?.entrances ?? 0),
    exits,
    exitRate: views > 0 ? exits / views : 0,
  }
}

export async function getPages(
  executor: QueryExecutor,
  input: RangeInput & { limit?: number }
): Promise<PageRow[]> {
  const rows = await selectRows<
    PageAggregate & { path: string; title: string | null }
  >(
    executor,
    sql`
      WITH ${filteredViews(input)}
      SELECT fv.path,
        (array_agg(fv.title ORDER BY fv."occurredAt" DESC) FILTER (WHERE fv.title IS NOT NULL))[1] AS title,
        ${PAGE_AGGREGATES}
      FROM fv
      WHERE NOT fv."isNotFound"
      GROUP BY fv.path
      ORDER BY views DESC, fv.path
      LIMIT ${input.limit ?? 100}
    `
  )
  return rows.map((row) => ({
    path: row.path,
    title: row.title ? row.title.replace(TITLE_SUFFIX, '') : null,
    contentGroup: contentGroupOf(row.path),
    ...toTotals(row),
  }))
}

export async function getPageDetail(
  executor: QueryExecutor,
  input: RangeInput & { bucket: TimeBucket; path: string }
): Promise<PageDetail> {
  const onPath = [sql`v.path = ${input.path}`]
  const [totals] = await selectRows<PageAggregate>(
    executor,
    sql`WITH ${filteredViews(input, onPath)} SELECT ${PAGE_AGGREGATES} FROM fv`
  )
  const series = await selectRows<{ bucket: string; views: number }>(
    executor,
    sql`
      WITH ${filteredViews(input, onPath)}
      SELECT ${bucketSql(sql`fv."occurredAt"`, input.bucket)} AS bucket, count(*)::int AS views
      FROM fv GROUP BY 1 ORDER BY 1
    `
  )
  const [scroll] = await selectRows<Record<string, number>>(
    executor,
    sql`
      WITH ${filteredViews(input, onPath)}
      SELECT count(*)::int AS total,
        count(*) FILTER (WHERE "maxScrollPercent" >= 25)::int AS s25,
        count(*) FILTER (WHERE "maxScrollPercent" >= 50)::int AS s50,
        count(*) FILTER (WHERE "maxScrollPercent" >= 75)::int AS s75,
        count(*) FILTER (WHERE "maxScrollPercent" >= 90)::int AS s90,
        count(*) FILTER (WHERE "maxScrollPercent" >= 100)::int AS s100
      FROM fv
    `
  )
  const flow = (offset: -1 | 1, marker: string) =>
    selectRows<PageFlowRow>(
      executor,
      sql`
        WITH ${filteredViews(input, onPath)}
        SELECT coalesce(n.path, ${marker}) AS path, count(*)::int AS views
        FROM fv
        LEFT JOIN analytics_page_views n
          ON n."sessionId" = fv."sessionId" AND n.sequence = fv.sequence + ${offset}
        GROUP BY 1 ORDER BY views DESC, 1 LIMIT 10
      `
    )
  const [previousPages, nextPages] = [
    await flow(-1, ENTRANCE_MARKER),
    await flow(1, EXIT_MARKER),
  ]
  const channels = await selectRows<{ channel: string; views: number }>(
    executor,
    sql`
      WITH ${filteredViews(input, onPath)}
      SELECT fv.channel, count(*)::int AS views FROM fv GROUP BY 1 ORDER BY views DESC, 1
    `
  )

  const total = Number(scroll?.total ?? 0)
  return {
    totals: toTotals(totals),
    series: series.map((row) => ({
      bucket: row.bucket,
      views: Number(row.views),
    })),
    scrollDepth: [25, 50, 75, 90, 100].map((threshold) => ({
      threshold,
      rate: total > 0 ? Number(scroll?.[`s${threshold}`] ?? 0) / total : 0,
    })),
    previousPages: previousPages.map((row) => ({
      path: row.path,
      views: Number(row.views),
    })),
    nextPages: nextPages.map((row) => ({
      path: row.path,
      views: Number(row.views),
    })),
    channels: channels.map((row) => ({
      channel: row.channel,
      views: Number(row.views),
    })),
  }
}

export async function getEvents(
  executor: QueryExecutor,
  input: RangeInput & { limit?: number }
): Promise<EventRow[]> {
  const rows = await selectRows<EventRow>(
    executor,
    sql`
      SELECT e.name, coalesce(e.label, e."targetUrl", '(not set)') AS label,
        count(*)::int AS count, count(DISTINCT e."sessionId")::int AS sessions
      FROM analytics_events e
      JOIN analytics_sessions s ON s.id = e."sessionId"
      JOIN analytics_page_views v ON v.id = e."pageViewId"
      WHERE e.name <> 'web_vital'
        AND e."occurredAt" >= ${timestampParam(input.start)}
        AND e."occurredAt" < ${timestampParam(input.end)}
        AND ${whereAll([...sessionConditions(input.filter, 's'), ...pageConditions(input.filter, 'v')])}
      GROUP BY 1, 2
      ORDER BY count DESC, 1, 2
      LIMIT ${input.limit ?? 100}
    `
  )
  return rows.map((row) => ({
    ...row,
    count: Number(row.count),
    sessions: Number(row.sessions),
  }))
}

/** 유입 경로: 방문 시작 페이지면 외부 리퍼러(없으면 직접), 아니면 바로 앞의 사이트 안 페이지. */
export async function getNotFound(
  executor: QueryExecutor,
  input: RangeInput & { limit?: number }
): Promise<NotFoundRow[]> {
  const rows = await selectRows<NotFoundRow>(
    executor,
    sql`
      WITH ${filteredViews(input, [sql`v."isNotFound"`])}
      SELECT fv.path,
        CASE WHEN fv.sequence = 1 THEN coalesce(fv."referrerHost", '(direct)') ELSE coalesce(p.path, '(unknown)') END AS referrer,
        count(*)::int AS views
      FROM fv
      LEFT JOIN analytics_page_views p ON p."sessionId" = fv."sessionId" AND p.sequence = fv.sequence - 1
      GROUP BY 1, 2
      ORDER BY views DESC, 1, 2
      LIMIT ${input.limit ?? 100}
    `
  )
  return rows.map((row) => ({
    path: row.path,
    views: Number(row.views),
    referrer: row.referrer,
  }))
}
