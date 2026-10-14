/**
 * 첫 페이지 로드의 Web Vitals를 PerformanceObserver로 직접 잰다. next/web-vitals(약 3KB)를 쓰면 공개 사이트 JS 예산을
 * 넘어서 같은 정의를 작게 구현했다. 탭이 처음 숨겨질 때 한 번 보고한다(그때까지의 값이 최종값이다).
 * INP는 상호작용별 최대 지연을 쓴다. 상호작용이 50회를 넘는 긴 방문에서는 공식 정의(98번째 백분위)보다 약간 크게 나온다.
 */
import type { WebVitalName } from '@/lib/analytics/events'
import type { WebVitalReport } from '@/lib/analytics/tracker/tracker'
import { rateWebVital } from '@/lib/analytics/web-vital-ratings'

type ShiftEntry = PerformanceEntry & { value: number; hadRecentInput: boolean }
type EventEntry = PerformanceEntry & { interactionId?: number }

// CLS는 1초 간격·최대 5초짜리 묶음 중 가장 큰 묶음의 합이다.
const SESSION_GAP_MS = 1000
const SESSION_MAX_MS = 5000

export function observeWebVitals(
  win: Window,
  report: (metric: WebVitalReport) => void
): void {
  if (typeof PerformanceObserver !== 'function') return
  const values: Partial<Record<WebVitalName, number>> = {}
  let session = { value: 0, start: 0, last: 0 }

  const observe = (
    type: string,
    handle: (entries: PerformanceEntry[]) => void
  ) => {
    try {
      new PerformanceObserver((list) => handle(list.getEntries())).observe({
        type,
        buffered: true,
        durationThreshold: 40,
      } as PerformanceObserverInit)
    } catch {
      // 지원하지 않는 항목 종류는 그 지표만 빼고 계속한다.
    }
  }

  observe('paint', (entries) => {
    const fcp = entries.find((entry) => entry.name === 'first-contentful-paint')
    if (fcp) values.FCP = fcp.startTime
  })
  observe('largest-contentful-paint', (entries) => {
    const last = entries.at(-1)
    if (last) values.LCP = last.startTime
  })
  observe('layout-shift', (entries) => {
    for (const entry of entries as ShiftEntry[]) {
      if (entry.hadRecentInput) continue
      const continues =
        session.value > 0 &&
        entry.startTime - session.last < SESSION_GAP_MS &&
        entry.startTime - session.start < SESSION_MAX_MS
      session = continues
        ? {
            ...session,
            value: session.value + entry.value,
            last: entry.startTime,
          }
        : { value: entry.value, start: entry.startTime, last: entry.startTime }
      values.CLS = Math.max(values.CLS ?? 0, session.value)
    }
  })
  observe('event', (entries) => {
    for (const entry of entries as EventEntry[]) {
      if (entry.interactionId)
        values.INP = Math.max(values.INP ?? 0, entry.duration)
    }
  })

  const navigation = win.performance.getEntriesByType('navigation')[0] as
    PerformanceNavigationTiming | undefined
  if (navigation && navigation.responseStart > 0)
    values.TTFB = navigation.responseStart

  let reported = false
  win.document.addEventListener('visibilitychange', () => {
    if (reported || win.document.visibilityState !== 'hidden') return
    reported = true
    for (const name of ['TTFB', 'FCP', 'LCP', 'CLS', 'INP'] as const) {
      const value = values[name]
      if (value === undefined) continue
      const rounded =
        name === 'CLS' ? Math.round(value * 10_000) / 10_000 : Math.round(value)
      report({ name, value: rounded, rating: rateWebVital(name, rounded) })
    }
  })
}
