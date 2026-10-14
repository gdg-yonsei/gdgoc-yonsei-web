/** 수집 스크립트·수집 API·대시보드가 함께 쓰는 값이다. 순수 모듈이라 클라이언트 번들에도 들어간다. */

/** 광고 차단 목록이 흔히 막는 단어(analytics, collect, track)를 피한 경로다. */
export const ANALYTICS_ENDPOINT = '/api/pulse'

export const VISITOR_STORAGE_KEY = 'gyms_vid'
export const SESSION_STORAGE_KEY = 'gyms_sid'
export const OPT_OUT_STORAGE_KEY = 'gyms_optout'

/** 마지막 활동 후 이 시간이 지나면 새 세션이다(GA4와 같은 기준). */
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000

export const MAX_BATCH_EVENTS = 20
export const MAX_BODY_BYTES = 16 * 1024

/** 비콘이 늦게 도착해도 발생 시각을 이보다 과거로 돌리지 않는다. 시계가 틀린 기기를 막는다. */
export const MAX_EVENT_AGE_MS = 5 * 60 * 1000

/** 전년 동기 비교가 가능하도록 2년에 두 달을 더 보관한다. */
export const RETENTION_MONTHS = 26

/** 채널 분류값. 수집 API가 정하고 대시보드 필터가 목록으로 쓴다(명세 5장 표의 순서). */
export const CHANNELS = [
  'Paid Search',
  'Paid Social',
  'Email',
  'AI Assistants',
  'Organic Search',
  'Organic Social',
  'Referral',
  'Campaign',
  'Direct',
] as const

export type Channel = (typeof CHANNELS)[number]

/** 404 화면이 렌더링하는 표지. 트래커가 조회를 보낼 때 이 속성이 있으면 404로 기록한다. */
export const NOT_FOUND_MARKER_ATTRIBUTE = 'data-analytics-not-found'

/** 이 속성의 값이 핵심 이벤트(CTA) 라벨이다. */
export const CTA_ATTRIBUTE = 'data-analytics'
