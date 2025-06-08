import {
  integer,
  pgTable,
  real,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

/**
 * @desc 웹사이트 성능 지표를 저장하는 테이블
 */
export const performanceMetrics = pgTable('performance_metrics', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  // 페이지 정보
  url: text('url').notNull(),
  pageTitle: text('page_title'),

  // 사용자 정보 (선택적)
  userId: text('user_id'),
  sessionId: text('session_id'),

  // Core Web Vitals
  lcp: real('lcp'), // Largest Contentful Paint (ms)
  inp: real('inp'), // Interaction to Next Paint (ms)
  cls: real('cls'), // Cumulative Layout Shift (점수)
  fcp: real('fcp'), // First Contentful Paint (ms)
  ttfb: real('ttfb'), // Time to First Byte (ms)
  tti: real('tti'), // Time to Interactive (ms)

  // 추가 성능 지표
  domContentLoadedTime: real('dom_content_loaded_time'), // DOM 콘텐츠 로드 시간 (ms)
  loadTime: real('load_time'), // 전체 페이지 로드 시간 (ms)
  firstPaintTime: real('first_paint_time'), // First Paint 시간 (ms)

  // 네트워크 정보
  connectionType: varchar('connection_type', { length: 50 }), // 연결 타입 (4g, wifi 등)
  effectiveType: varchar('effective_type', { length: 20 }), // 효과적인 연결 타입

  // 디바이스 및 브라우저 정보
  userAgent: text('user_agent'),
  deviceType: varchar('device_type', { length: 20 }), // mobile, desktop, tablet
  screenResolution: varchar('screen_resolution', { length: 20 }), // 1920x1080
  viewport: varchar('viewport', { length: 20 }), // 뷰포트 크기

  // 브라우저 정보
  browserName: varchar('browser_name', { length: 50 }),
  browserVersion: varchar('browser_version', { length: 50 }),

  // 지리적 정보 (선택적)
  ip: varchar('ip', { length: 46 }), // IPv4/IPv6 주소
  country: varchar('country', { length: 2 }), // 국가 코드
  region: varchar('region', { length: 100 }),

  // 메타데이터
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

/**
 * @desc 성능 측정 요약 정보를 저장하는 테이블 (일별/시간별 집계용)
 */
export const performanceSummary = pgTable('performance_summary', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  // 집계 기준
  url: text('url').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD 형식
  hour: integer('hour'), // 0-23, null이면 일별 집계

  // 집계된 성능 지표 (평균값)
  avgLcp: real('avg_lcp'),
  avgFid: real('avg_fid'),
  avgCls: real('avg_cls'),
  avgFcp: real('avg_fcp'),
  avgTtfb: real('avg_ttfb'),
  avgTti: real('avg_tti'),
  avgLoadTime: real('avg_load_time'),

  // 집계 통계
  sampleCount: integer('sample_count').notNull().default(0), // 샘플 수

  // 백분위수 값들
  p50Lcp: real('p50_lcp'), // 중간값
  p90Lcp: real('p90_lcp'), // 90분위수
  p95Lcp: real('p95_lcp'), // 95분위수

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const performanceMetricsRelations = relations(
  performanceMetrics,
  ({ one }) => ({
    // 필요시 users 테이블과의 관계 추가 가능
  })
)

export const performanceSummaryRelations = relations(
  performanceSummary,
  ({ many }) => ({
    // 필요시 관계 추가 가능
  })
)
