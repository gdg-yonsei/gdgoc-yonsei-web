/** 공개 사이트 방문 분석. 행은 /api/pulse만 쓰고, 세션을 지우면 조회·이벤트가 함께 지워진다(보관 기간 정리). */
import {
  bigint,
  boolean,
  char,
  doublePrecision,
  index,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

// id는 브라우저가 만든 sessionId다. 세션 속성은 세션 첫 조회의 값으로 고정한다.
export const analyticsSessions = pgTable(
  'analytics_sessions',
  {
    id: uuid('id').primaryKey(),
    visitorId: uuid('visitorId').notNull(),
    startedAt: timestamp('startedAt').notNull(),
    lastSeenAt: timestamp('lastSeenAt').notNull(),
    isNewVisitor: boolean('isNewVisitor').notNull(),
    isInternal: boolean('isInternal').notNull(),
    landingPath: text('landingPath').notNull(),
    referrerHost: text('referrerHost'),
    referrerPath: text('referrerPath'),
    utmSource: text('utmSource'),
    utmMedium: text('utmMedium'),
    utmCampaign: text('utmCampaign'),
    utmTerm: text('utmTerm'),
    utmContent: text('utmContent'),
    channel: text('channel').notNull(),
    deviceType: text('deviceType').notNull(),
    browser: text('browser').notNull(),
    os: text('os').notNull(),
    screenWidth: smallint('screenWidth'),
    screenHeight: smallint('screenHeight'),
    language: text('language'),
    timezone: text('timezone'),
    country: char('country', { length: 2 }).notNull(),
  },
  (table) => [
    index('analytics_sessions_startedAt_idx').on(table.startedAt),
    index('analytics_sessions_visitorId_startedAt_idx').on(
      table.visitorId,
      table.startedAt
    ),
  ]
)

// visitorId는 사용자 수 집계 때 세션과 조인하지 않으려고 중복 저장한다.
export const analyticsPageViews = pgTable(
  'analytics_page_views',
  {
    id: uuid('id').primaryKey(),
    sessionId: uuid('sessionId')
      .notNull()
      .references(() => analyticsSessions.id, { onDelete: 'cascade' }),
    visitorId: uuid('visitorId').notNull(),
    occurredAt: timestamp('occurredAt').notNull(),
    sequence: smallint('sequence').notNull(),
    path: text('path').notNull(),
    locale: text('locale').notNull(),
    title: text('title'),
    isNotFound: boolean('isNotFound').notNull().default(false),
    engagementMs: integer('engagementMs').notNull().default(0),
    maxScrollPercent: smallint('maxScrollPercent').notNull().default(0),
  },
  (table) => [
    index('analytics_page_views_occurredAt_idx').on(table.occurredAt),
    index('analytics_page_views_path_occurredAt_idx').on(
      table.path,
      table.occurredAt
    ),
    index('analytics_page_views_sessionId_sequence_idx').on(
      table.sessionId,
      table.sequence
    ),
  ]
)

// name: outbound·download·contact·cta(클릭)와 web_vital. 클릭은 label·targetUrl, Web Vitals는 metric·rating·value를 쓴다.
export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: bigint('id', { mode: 'number' })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    sessionId: uuid('sessionId')
      .notNull()
      .references(() => analyticsSessions.id, { onDelete: 'cascade' }),
    pageViewId: uuid('pageViewId')
      .notNull()
      .references(() => analyticsPageViews.id, { onDelete: 'cascade' }),
    occurredAt: timestamp('occurredAt').notNull(),
    name: text('name').notNull(),
    path: text('path').notNull(),
    label: text('label'),
    targetUrl: text('targetUrl'),
    metric: text('metric'),
    rating: text('rating'),
    value: doublePrecision('value'),
  },
  (table) => [
    index('analytics_events_name_occurredAt_idx').on(
      table.name,
      table.occurredAt
    ),
    index('analytics_events_pageViewId_idx').on(table.pageViewId),
    // 세션별 핵심 이벤트 수를 셀 때(대시보드 참여 세션 판정) 쓴다.
    index('analytics_events_sessionId_idx').on(table.sessionId),
  ]
)
