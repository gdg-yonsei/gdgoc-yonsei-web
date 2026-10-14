/** 트래커가 보내고 수집 API가 받는 이벤트 형식이다. 타입만 두어 클라이언트 번들에 런타임 코드를 더하지 않는다. */

export type ClickKind = 'outbound' | 'download' | 'contact' | 'cta'

export const WEB_VITAL_NAMES = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'] as const
export type WebVitalName = (typeof WEB_VITAL_NAMES)[number]
export type WebVitalRating = 'good' | 'needs-improvement' | 'poor'

export type UtmParams = {
  source?: string
  medium?: string
  campaign?: string
  term?: string
  content?: string
}

/** `ageMs`는 이벤트 발생부터 전송까지 걸린 시간이다. 서버가 자기 시계로 발생 시각을 계산한다. */
type EventBase = { ageMs: number; pageViewId: string; sessionId: string }

/** 세션 속성(리퍼러, UTM, 화면, 언어, 시간대)은 세션 행을 처음 만들 때만 쓰인다. */
export type PageViewEvent = EventBase & {
  type: 'page_view'
  visitorId: string
  isNewVisitor: boolean
  isSessionStart: boolean
  sequence: number
  path: string
  title?: string
  referrer?: string
  utm?: UtmParams
  screenWidth?: number
  screenHeight?: number
  language?: string
  timezone?: string
  isNotFound: boolean
}

/** 값은 누적값이다. 서버가 기존 값과 큰 쪽을 취하므로 여러 번 보내도 안전하다. */
export type EngagementEvent = EventBase & {
  type: 'engagement'
  engagementMs: number
  maxScrollPercent: number
}

export type ClickEvent = EventBase & {
  type: 'click'
  path: string
  kind: ClickKind
  label?: string
  targetUrl?: string
}

export type WebVitalEvent = EventBase & {
  type: 'web_vital'
  path: string
  metric: WebVitalName
  value: number
  rating: WebVitalRating
}

export type AnalyticsEvent =
  PageViewEvent | EngagementEvent | ClickEvent | WebVitalEvent

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never

/** 큐에 넣을 때는 `ageMs`를 모른다. 전송 직전에 큐가 채운다. */
export type QueuedAnalyticsEvent = DistributiveOmit<AnalyticsEvent, 'ageMs'>
