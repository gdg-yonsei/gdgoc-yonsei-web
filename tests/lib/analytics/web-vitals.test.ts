import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { observeWebVitals } from '@/lib/analytics/tracker/web-vitals'
import { rateWebVital } from '@/lib/analytics/web-vital-ratings'

type Listener = (list: { getEntries: () => PerformanceEntry[] }) => void

// jsdom에는 PerformanceObserver가 없어 관찰 대상별로 콜백을 잡아 두고 항목을 직접 흘려보낸다.
const observers = new Map<string, Listener>()

class FakePerformanceObserver {
  constructor(private readonly listener: Listener) {}
  observe(options: { type: string }) {
    observers.set(options.type, this.listener)
  }
  disconnect() {}
}

function emit(type: string, entries: Array<Record<string, unknown>>) {
  observers.get(type)?.({
    getEntries: () => entries as unknown as PerformanceEntry[],
  })
}

function hide() {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value: 'hidden',
  })
  document.dispatchEvent(new Event('visibilitychange'))
}

beforeEach(() => {
  observers.clear()
  vi.stubGlobal('PerformanceObserver', FakePerformanceObserver)
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value: 'visible',
  })
  vi.spyOn(performance, 'getEntriesByType').mockImplementation(
    (type: string) =>
      type === 'navigation'
        ? ([{ responseStart: 420 }] as unknown as PerformanceEntryList)
        : []
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('observeWebVitals', () => {
  it('reports the final LCP, FCP, CLS, INP and TTFB once when the page is hidden', () => {
    const report = vi.fn()
    observeWebVitals(window, report)

    emit('paint', [{ name: 'first-contentful-paint', startTime: 900 }])
    emit('largest-contentful-paint', [{ startTime: 1200 }, { startTime: 2600 }])
    emit('layout-shift', [
      { value: 0.05, startTime: 1000, hadRecentInput: false },
      { value: 0.04, startTime: 1500, hadRecentInput: false },
      { value: 0.3, startTime: 1600, hadRecentInput: true },
      { value: 0.02, startTime: 9000, hadRecentInput: false },
    ])
    emit('event', [
      { duration: 80, interactionId: 1 },
      { duration: 240, interactionId: 2 },
      { duration: 900, interactionId: 0 },
    ])
    hide()
    hide()

    expect(report.mock.calls.map(([metric]) => metric)).toEqual([
      { name: 'TTFB', value: 420, rating: 'good' },
      { name: 'FCP', value: 900, rating: 'good' },
      { name: 'LCP', value: 2600, rating: 'needs-improvement' },
      { name: 'CLS', value: 0.09, rating: 'good' },
      { name: 'INP', value: 240, rating: 'needs-improvement' },
    ])
  })

  it('skips metrics the browser never measured', () => {
    const report = vi.fn()
    observeWebVitals(window, report)
    hide()
    expect(
      report.mock.calls.map(([metric]) => (metric as { name: string }).name)
    ).toEqual(['TTFB'])
  })

  it('does nothing without PerformanceObserver', () => {
    vi.stubGlobal('PerformanceObserver', undefined)
    const report = vi.fn()
    expect(() => observeWebVitals(window, report)).not.toThrow()
    hide()
    expect(report).not.toHaveBeenCalled()
  })
})

describe('rateWebVital', () => {
  it.each([
    ['LCP', 2500, 'good'],
    ['LCP', 4001, 'poor'],
    ['INP', 200, 'good'],
    ['CLS', 0.1, 'good'],
    ['CLS', 0.26, 'poor'],
    ['TTFB', 900, 'needs-improvement'],
  ] as const)('%s %d → %s', (metric, value, rating) => {
    expect(rateWebVital(metric, value)).toBe(rating)
  })
})
