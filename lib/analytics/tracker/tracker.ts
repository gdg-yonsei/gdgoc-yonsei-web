/**
 * 식별자·참여 시간·스크롤·클릭·큐를 DOM 이벤트에 연결한다. React와 무관해 jsdom에서 그대로 테스트한다.
 * 수집 허용 여부는 보낼 때마다 다시 확인해, 처리방침에서 거부하면 그 즉시 멈춘다.
 */
import {
  CTA_ATTRIBUTE,
  NOT_FOUND_MARKER_ATTRIBUTE,
} from '@/lib/analytics/constants'
import {
  WEB_VITAL_NAMES,
  type UtmParams,
  type WebVitalName,
  type WebVitalRating,
} from '@/lib/analytics/events'
import { classifyClick } from '@/lib/analytics/tracker/clicks'
import {
  createEngagementTimer,
  type EngagementTimer,
} from '@/lib/analytics/tracker/engagement'
import {
  isTrackingAllowed,
  startPageView,
  touchSession,
  type KeyValueStorage,
} from '@/lib/analytics/tracker/identity'
import { createEventQueue } from '@/lib/analytics/tracker/queue'
import { scrollPercent } from '@/lib/analytics/tracker/scroll'

export type TrackerEnvironment = {
  window: Window
  storage: KeyValueStorage
  /** 실제 localStorage면 true. 메모리 대체물이면 신규 방문자로 세지 않는다. */
  persistent: boolean
  now: () => number
  createId: () => string
  send: (body: string) => void
}

/** `next/web-vitals`가 넘기는 값 중 쓰는 것만. */
export type WebVitalReport = { name: string; value: number; rating?: string }

export type Tracker = {
  trackPageView(): void
  reportWebVital(metric: WebVitalReport): void
  destroy(): void
}

type CurrentPage = {
  pageViewId: string
  sessionId: string
  path: string
  maxScroll: number
  timer: EngagementTimer
}

const UTM_KEYS = ['source', 'medium', 'campaign', 'term', 'content'] as const
const RATINGS: readonly string[] = ['good', 'needs-improvement', 'poor']

function readUtm(search: string): UtmParams | undefined {
  const params = new URLSearchParams(search)
  const utm: UtmParams = {}
  for (const key of UTM_KEYS) {
    const value = params.get(`utm_${key}`)?.trim()
    if (value) utm[key] = value.slice(0, 200)
  }
  return Object.keys(utm).length > 0 ? utm : undefined
}

export function createTracker(environment: TrackerEnvironment): Tracker {
  const { window: win, storage, now } = environment
  const doc = win.document
  const queue = createEventQueue(environment.send, now)
  let current: CurrentPage | null = null
  let scrollFrame = 0

  const allowed = () => isTrackingAllowed(win.navigator, storage)
  const isActive = () => doc.visibilityState === 'visible' && doc.hasFocus()

  function updateScroll() {
    scrollFrame = 0
    if (!current) return
    const percent = scrollPercent(
      win.scrollY,
      win.innerHeight,
      doc.documentElement.scrollHeight
    )
    if (percent > current.maxScroll) current.maxScroll = percent
  }

  function queueEngagement() {
    if (!current) return
    queue.push({
      type: 'engagement',
      pageViewId: current.pageViewId,
      sessionId: current.sessionId,
      engagementMs: Math.round(current.timer.total()),
      maxScrollPercent: current.maxScroll,
    })
  }

  function flushPage() {
    if (!current || !allowed()) return
    queueEngagement()
    queue.flush()
  }

  function trackPageView() {
    if (!allowed()) return
    const path = win.location.pathname
    // 개발 모드 StrictMode는 effect를 두 번 실행한다. 같은 경로의 재호출은 새 조회가 아니다.
    if (current?.path === path) return

    queueEngagement()
    const visit = startPageView(
      storage,
      now(),
      environment.createId,
      environment.persistent
    )
    current = {
      pageViewId: environment.createId(),
      sessionId: visit.sessionId,
      path,
      maxScroll: 0,
      timer: createEngagementTimer(now, isActive()),
    }
    updateScroll()

    queue.push(
      {
        type: 'page_view',
        pageViewId: current.pageViewId,
        sessionId: visit.sessionId,
        visitorId: visit.visitorId,
        isNewVisitor: visit.isNewVisitor,
        isSessionStart: visit.isSessionStart,
        sequence: visit.sequence,
        path,
        title: doc.title ? doc.title.slice(0, 300) : undefined,
        // soft navigation에서도 document.referrer는 첫 진입 값 그대로라 세션 첫 조회에만 보낸다.
        referrer:
          visit.isSessionStart && doc.referrer
            ? doc.referrer.slice(0, 1024)
            : undefined,
        utm: readUtm(win.location.search),
        screenWidth: win.screen.width || undefined,
        screenHeight: win.screen.height || undefined,
        language: win.navigator.language || undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || undefined,
        isNotFound:
          doc.querySelector(`[${NOT_FOUND_MARKER_ATTRIBUTE}]`) !== null,
      },
      { immediate: true }
    )
  }

  function reportWebVital(metric: WebVitalReport) {
    if (!current || !allowed()) return
    if (!(WEB_VITAL_NAMES as readonly string[]).includes(metric.name)) return
    if (!metric.rating || !RATINGS.includes(metric.rating)) return
    queue.push({
      type: 'web_vital',
      pageViewId: current.pageViewId,
      sessionId: current.sessionId,
      path: current.path,
      metric: metric.name as WebVitalName,
      value: metric.value,
      rating: metric.rating as WebVitalRating,
    })
  }

  function onClick(event: MouseEvent) {
    if (!current || !allowed() || !(event.target instanceof win.Element)) return
    const element = event.target.closest(`a[href], [${CTA_ATTRIBUTE}]`)
    if (!element) return
    const click = classifyClick(
      {
        href: element.getAttribute('href'),
        ctaLabel: element.getAttribute(CTA_ATTRIBUTE),
        download: element.hasAttribute('download'),
      },
      win.location.origin
    )
    if (!click) return
    touchSession(storage, now())
    queue.push({
      type: 'click',
      pageViewId: current.pageViewId,
      sessionId: current.sessionId,
      path: current.path,
      ...click,
    })
  }

  function onVisibilityChange() {
    if (doc.visibilityState === 'hidden') {
      current?.timer.pause()
      flushPage()
    } else if (isActive()) {
      current?.timer.resume()
    }
  }

  const onFocus = () => {
    if (doc.visibilityState === 'visible') current?.timer.resume()
  }
  const onBlur = () => current?.timer.pause()
  const onScroll = () => {
    scrollFrame ||= win.requestAnimationFrame(updateScroll)
  }

  doc.addEventListener('visibilitychange', onVisibilityChange)
  doc.addEventListener('click', onClick, { capture: true })
  win.addEventListener('pagehide', flushPage)
  win.addEventListener('focus', onFocus)
  win.addEventListener('blur', onBlur)
  win.addEventListener('scroll', onScroll, { passive: true })

  return {
    trackPageView,
    reportWebVital,
    destroy() {
      doc.removeEventListener('visibilitychange', onVisibilityChange)
      doc.removeEventListener('click', onClick, { capture: true })
      win.removeEventListener('pagehide', flushPage)
      win.removeEventListener('focus', onFocus)
      win.removeEventListener('blur', onBlur)
      win.removeEventListener('scroll', onScroll)
      if (scrollFrame) win.cancelAnimationFrame(scrollFrame)
    },
  }
}
