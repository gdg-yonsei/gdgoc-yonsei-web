/** 지표 정의와 임계값의 단일 출처. 화면·MCP·테스트가 같이 쓴다(명세 7장). GA4 정의를 따른다. */

export const ENGAGED_MIN_ENGAGEMENT_MS = 10_000
export const ENGAGED_MIN_VIEWS = 2

// 등급 기준은 수집기와 같은 모듈을 쓴다.
export {
  WEB_VITAL_THRESHOLDS,
  rateWebVital,
} from '@/lib/analytics/web-vital-ratings'

/** SQL이 돌려주는 합계. 비율은 `deriveSessionMetrics`가 계산한다. */
export type SessionMetrics = {
  users: number
  newUsers: number
  sessions: number
  engagedSessions: number
  views: number
  engagementMs: number
  keyEvents: number
}

export type DerivedSessionMetrics = SessionMetrics & {
  engagementRate: number
  bounceRate: number
  viewsPerSession: number
  avgEngagementSeconds: number
}

export const SESSION_METRIC_KEYS = [
  'users',
  'newUsers',
  'sessions',
  'engagedSessions',
  'engagementRate',
  'bounceRate',
  'views',
  'viewsPerSession',
  'avgEngagementSeconds',
  'keyEvents',
] as const

export type SessionMetricKey = (typeof SESSION_METRIC_KEYS)[number]

export const EMPTY_SESSION_METRICS: SessionMetrics = {
  users: 0,
  newUsers: 0,
  sessions: 0,
  engagedSessions: 0,
  views: 0,
  engagementMs: 0,
  keyEvents: 0,
}

function ratio(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : 0
}

/** 세션이 없으면 비율은 0이다. 화면에 NaN·Infinity가 나오지 않게 한다. */
export function deriveSessionMetrics(
  metrics: SessionMetrics
): DerivedSessionMetrics {
  const engagementRate = ratio(metrics.engagedSessions, metrics.sessions)
  return {
    ...metrics,
    engagementRate,
    bounceRate: metrics.sessions > 0 ? 1 - engagementRate : 0,
    viewsPerSession: ratio(metrics.views, metrics.sessions),
    avgEngagementSeconds: ratio(metrics.engagementMs, metrics.sessions) / 1000,
  }
}

/** 직전 값이 0이면 증감률을 정의할 수 없어 null. */
export function percentChange(
  current: number,
  previous: number
): number | null {
  return previous > 0 ? (current - previous) / previous : null
}
