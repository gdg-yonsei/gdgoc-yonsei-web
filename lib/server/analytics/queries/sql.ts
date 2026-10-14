/**
 * 분석 쿼리 공용 도구. 드라이버(postgres-js·PGlite)마다 execute 결과 모양이 달라 selectRows로 맞춘다.
 * 저장된 timestamp는 시간대 없는 UTC 시각이라 서울 구간은 9시간을 더해 자른다.
 */
import 'server-only'

import { sql, type SQL } from 'drizzle-orm'
import { db } from '@/db'
import { CONTENT_GROUP_RULES } from '@/lib/analytics/content-groups'
import type { TimeBucket } from '@/lib/analytics/date-range'
import type { AnalyticsFilter } from '@/lib/analytics/filters'

export type QueryExecutor = { execute: (query: SQL) => Promise<unknown> }

export async function selectRows<T>(
  executor: QueryExecutor,
  query: SQL
): Promise<T[]> {
  const result = await executor.execute(query)
  return (
    Array.isArray(result) ? result : (result as { rows: T[] }).rows
  ) as T[]
}

/** 무거운 기간 쿼리가 DB를 붙잡지 않게 10초에서 끊는다. 초과하면 Postgres가 57014 오류를 던진다. */
export function withAnalyticsTimeout<T>(
  work: (tx: QueryExecutor) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL statement_timeout = '10s'`)
    return work(tx)
  })
}

export function isQueryTimeout(error: unknown): boolean {
  const code = error as { code?: unknown; cause?: { code?: unknown } } | null
  return code?.code === '57014' || code?.cause?.code === '57014'
}

export function timestampParam(date: Date): SQL {
  return sql`${date.toISOString()}::timestamp`
}

/** `lib/analytics/date-range.ts`의 `bucketKeys`와 같은 키를 만든다. */
export function bucketSql(column: SQL, bucket: TimeBucket): SQL {
  const seoul = sql`(${column} + interval '9 hours')`
  if (bucket === 'hour') return sql`to_char(${seoul}, 'YYYY-MM-DD"T"HH24')`
  if (bucket === 'week')
    return sql`to_char(date_trunc('week', ${seoul}), 'YYYY-MM-DD')`
  return sql`to_char(${seoul}, 'YYYY-MM-DD')`
}

export function contentGroupSql(column: SQL): SQL {
  const cases = CONTENT_GROUP_RULES.map(
    (rule) => sql`WHEN ${column} ~ ${rule.pattern} THEN ${rule.group}`
  )
  return sql`(CASE ${sql.join(cases, sql` `)} ELSE 'other' END)`
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`)
}

/** 세션 속성 필터(기간 제외). `alias`는 analytics_sessions 별칭이다. */
export function sessionConditions(
  filter: AnalyticsFilter,
  alias: string
): SQL[] {
  const s = sql.raw(`"${alias}"`)
  const conditions: SQL[] = []
  if (!filter.includeInternal) conditions.push(sql`NOT ${s}."isInternal"`)
  if (filter.channel) conditions.push(sql`${s}.channel = ${filter.channel}`)
  if (filter.device) conditions.push(sql`${s}."deviceType" = ${filter.device}`)
  if (filter.country) conditions.push(sql`${s}.country = ${filter.country}`)
  if (filter.visitor)
    conditions.push(sql`${s}."isNewVisitor" = ${filter.visitor === 'new'}`)
  return conditions
}

/** 페이지 속성 필터. `alias`는 analytics_page_views 별칭이다. */
export function pageConditions(filter: AnalyticsFilter, alias: string): SQL[] {
  const v = sql.raw(`"${alias}"`)
  const conditions: SQL[] = []
  if (filter.locale) conditions.push(sql`${v}.locale = ${filter.locale}`)
  if (filter.contentGroup)
    conditions.push(
      sql`${contentGroupSql(sql`${v}.path`)} = ${filter.contentGroup}`
    )
  if (filter.path)
    conditions.push(
      sql`${v}.path ILIKE ${`%${escapeLike(filter.path)}%`} ESCAPE '\\'`
    )
  return conditions
}

export function whereAll(conditions: SQL[]): SQL {
  return conditions.length > 0 ? sql.join(conditions, sql` AND `) : sql`TRUE`
}
