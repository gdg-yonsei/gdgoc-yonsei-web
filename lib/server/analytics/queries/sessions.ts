/**
 * 세션 단위 지표를 원하는 차원으로 묶는 범용 집계. 개요·유입·사용자·탐색이 모두 이 함수 하나를 차원만 바꿔 쓴다.
 * 세션은 시작 시각으로 기간에 넣고(GA4와 같음), 페이지 필터가 있으면 맞는 조회가 하나라도 있는 세션만 센다.
 */
import 'server-only'

import { sql, type SQL } from 'drizzle-orm'
import type { TimeBucket } from '@/lib/analytics/date-range'
import type { AnalyticsFilter } from '@/lib/analytics/filters'
import {
  ENGAGED_MIN_ENGAGEMENT_MS,
  ENGAGED_MIN_VIEWS,
  type SessionMetrics,
} from '@/lib/analytics/metrics'
import {
  bucketSql,
  contentGroupSql,
  pageConditions,
  selectRows,
  sessionConditions,
  timestampParam,
  whereAll,
  type QueryExecutor,
} from '@/lib/server/analytics/queries/sql'

export const SESSION_DIMENSIONS = [
  'date',
  'channel',
  'source',
  'medium',
  'campaign',
  'referrer',
  'landingPath',
  'landingGroup',
  'deviceType',
  'browser',
  'os',
  'screen',
  'country',
  'language',
  'visitorType',
  'weekday',
  'hour',
] as const

export type SessionDimension = (typeof SESSION_DIMENSIONS)[number]

export type SessionMetricRow = {
  dimensions: Record<string, string>
  metrics: SessionMetrics
}

function dimensionSql(dimension: SessionDimension, bucket: TimeBucket): SQL {
  const seoul = sql`(ss."startedAt" + interval '9 hours')`
  switch (dimension) {
    case 'date':
      return bucketSql(sql`ss."startedAt"`, bucket)
    case 'channel':
      return sql`ss.channel`
    case 'source':
      return sql`coalesce(ss."utmSource", ss."referrerHost", '(direct)')`
    case 'medium':
      return sql`coalesce(ss."utmMedium", CASE WHEN ss.channel = 'Organic Search' THEN 'organic' WHEN ss."referrerHost" IS NOT NULL THEN 'referral' ELSE '(none)' END)`
    case 'campaign':
      return sql`coalesce(ss."utmCampaign", '(not set)')`
    case 'referrer':
      return sql`coalesce(ss."referrerHost", '(direct)')`
    case 'landingPath':
      return sql`ss."landingPath"`
    case 'landingGroup':
      return contentGroupSql(sql`ss."landingPath"`)
    case 'deviceType':
      return sql`ss."deviceType"`
    case 'browser':
      return sql`ss.browser`
    case 'os':
      return sql`ss.os`
    case 'screen':
      return sql`coalesce(ss."screenWidth"::text || 'x' || ss."screenHeight"::text, 'unknown')`
    case 'country':
      return sql`ss.country`
    case 'language':
      return sql`lower(split_part(coalesce(ss.language, 'unknown'), '-', 1))`
    case 'visitorType':
      return sql`CASE WHEN ss."isNewVisitor" THEN 'new' ELSE 'returning' END`
    case 'weekday':
      // 0 = 월요일
      return sql`(extract(isodow from ${seoul})::int - 1)::text`
    case 'hour':
      return sql`extract(hour from ${seoul})::int::text`
  }
}

/** 세션별 조회 수·참여 시간·핵심 이벤트 수와 참여 여부를 붙인 CTE. */
function sessionStatsCte(filter: AnalyticsFilter, start: Date, end: Date): SQL {
  const pageFilter = pageConditions(filter, 'fv')
  const conditions = [
    sql`s."startedAt" >= ${timestampParam(start)}`,
    sql`s."startedAt" < ${timestampParam(end)}`,
    ...sessionConditions(filter, 's'),
  ]
  if (pageFilter.length > 0) {
    conditions.push(
      sql`EXISTS (SELECT 1 FROM analytics_page_views fv WHERE fv."sessionId" = s.id AND ${whereAll(pageFilter)})`
    )
  }
  // 페이지 필터가 있으면 조회수·참여 시간은 맞는 페이지만 센다(GA4와 같음). 참여 세션 판정은 세션 전체 기준이다.
  const matchesPage = whereAll(pageConditions(filter, 'pv'))
  return sql`
    ss AS (
      SELECT s.*,
        coalesce(v.views, 0) AS views,
        coalesce(v.engagement_ms, 0) AS engagement_ms,
        coalesce(e.key_events, 0) AS key_events,
        (coalesce(v.all_engagement_ms, 0) >= ${ENGAGED_MIN_ENGAGEMENT_MS}
          OR coalesce(v.all_views, 0) >= ${ENGAGED_MIN_VIEWS}
          OR coalesce(e.key_events, 0) > 0) AS engaged
      FROM analytics_sessions s
      LEFT JOIN LATERAL (
        SELECT count(*) AS all_views,
          sum(pv."engagementMs") AS all_engagement_ms,
          count(*) FILTER (WHERE ${matchesPage}) AS views,
          sum(pv."engagementMs") FILTER (WHERE ${matchesPage}) AS engagement_ms
        FROM analytics_page_views pv WHERE pv."sessionId" = s.id
      ) v ON TRUE
      LEFT JOIN LATERAL (
        SELECT count(*) AS key_events
        FROM analytics_events WHERE "sessionId" = s.id AND name = 'cta'
      ) e ON TRUE
      WHERE ${whereAll(conditions)}
    )`
}

type RawRow = Record<string, string | number | null> & {
  users: number
  new_users: number
  sessions: number
  engaged_sessions: number
  views: number
  engagement_ms: number
  key_events: number
}

/** 차원이 비어 있으면 합계 한 행(세션이 없으면 빈 배열). 기본 정렬은 세션 수 내림차순. */
export async function aggregateSessions(
  executor: QueryExecutor,
  input: {
    filter: AnalyticsFilter
    start: Date
    end: Date
    bucket: TimeBucket
    dimensions: SessionDimension[]
    orderBy?: keyof SessionMetrics
    limit?: number
  }
): Promise<SessionMetricRow[]> {
  const columns = input.dimensions.map(
    (dimension) =>
      sql`${dimensionSql(dimension, input.bucket)} AS ${sql.raw(`"dim_${dimension}"`)}`
  )
  const groupBy = input.dimensions.map((_, index) => sql.raw(String(index + 1)))
  const orderColumn = {
    users: 'users',
    newUsers: 'new_users',
    sessions: 'sessions',
    engagedSessions: 'engaged_sessions',
    views: 'views',
    engagementMs: 'engagement_ms',
    keyEvents: 'key_events',
  }[input.orderBy ?? 'sessions']

  const rows = await selectRows<RawRow>(
    executor,
    sql`
      WITH ${sessionStatsCte(input.filter, input.start, input.end)}
      SELECT ${columns.length > 0 ? sql`${sql.join(columns, sql`, `)},` : sql``}
        count(*)::int AS sessions,
        count(DISTINCT ss."visitorId")::int AS users,
        count(DISTINCT ss."visitorId") FILTER (WHERE ss."isNewVisitor")::int AS new_users,
        count(*) FILTER (WHERE ss.engaged)::int AS engaged_sessions,
        coalesce(sum(ss.views), 0)::float8 AS views,
        coalesce(sum(ss.engagement_ms), 0)::float8 AS engagement_ms,
        coalesce(sum(ss.key_events), 0)::float8 AS key_events
      FROM ss
      ${groupBy.length > 0 ? sql`GROUP BY ${sql.join(groupBy, sql`, `)}` : sql``}
      HAVING count(*) > 0
      ORDER BY ${sql.raw(orderColumn)} DESC${groupBy.length > 0 ? sql`, ${sql.join(groupBy, sql`, `)}` : sql``}
      ${input.limit ? sql`LIMIT ${input.limit}` : sql``}
    `
  )

  return rows.map((row) => ({
    dimensions: Object.fromEntries(
      input.dimensions.map((dimension) => [
        dimension,
        String(row[`dim_${dimension}`]),
      ])
    ),
    metrics: {
      users: Number(row.users),
      newUsers: Number(row.new_users),
      sessions: Number(row.sessions),
      engagedSessions: Number(row.engaged_sessions),
      views: Number(row.views),
      engagementMs: Number(row.engagement_ms),
      keyEvents: Number(row.key_events),
    },
  }))
}

/** 첫 세션 시작 시각. 빈 화면에 "언제부터 수집 중인지"를 보여 준다. */
export async function collectingSince(
  executor: QueryExecutor
): Promise<Date | null> {
  const [row] = await selectRows<{ since: string | null }>(
    executor,
    sql`SELECT to_char(min("startedAt"), 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS since FROM analytics_sessions`
  )
  return row?.since ? new Date(row.since) : null
}
