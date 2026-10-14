import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTracker, type Tracker } from '@/lib/analytics/tracker/tracker'
import type { KeyValueStorage } from '@/lib/analytics/tracker/identity'

let now = 0
let sent: Array<{ events: Array<Record<string, unknown>> }> = []
let tracker: Tracker | null = null

function memoryStorage(): KeyValueStorage {
  const data: Record<string, string> = {}
  return {
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value
    },
    removeItem: (key) => {
      delete data[key]
    },
  }
}

function start(storage: KeyValueStorage = memoryStorage()) {
  let id = 0
  tracker = createTracker({
    window,
    storage,
    persistent: true,
    now: () => now,
    createId: () => `00000000-0000-4000-8000-${String(++id).padStart(12, '0')}`,
    send: (body) => sent.push(JSON.parse(body) as (typeof sent)[number]),
  })
  return tracker
}

const events = () => sent.flatMap((batch) => batch.events)

beforeEach(() => {
  now = 0
  sent = []
  window.history.replaceState(
    null,
    '',
    '/ko?utm_source=instagram&utm_medium=social'
  )
  document.title = '홈 | GDGoC Yonsei'
  document.body.innerHTML = ''
  vi.spyOn(document, 'hasFocus').mockReturnValue(true)
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value: 'visible',
  })
})

afterEach(() => {
  tracker?.destroy()
  tracker = null
  vi.restoreAllMocks()
})

describe('createTracker', () => {
  it('sends the first page view immediately with session attributes', () => {
    start().trackPageView()
    expect(events()).toEqual([
      expect.objectContaining({
        type: 'page_view',
        path: '/ko',
        title: '홈 | GDGoC Yonsei',
        isSessionStart: true,
        isNewVisitor: true,
        sequence: 1,
        utm: { source: 'instagram', medium: 'social' },
        isNotFound: false,
        ageMs: 0,
      }),
    ])
  })

  it('ignores a repeated call for the same path', () => {
    const t = start()
    t.trackPageView()
    t.trackPageView()
    expect(events().filter((event) => event.type === 'page_view')).toHaveLength(
      1
    )
  })

  it('sends the previous page engagement before the next page view', () => {
    const t = start()
    t.trackPageView()
    now = 12_000
    window.history.pushState(null, '', '/ko/session')
    t.trackPageView()

    const [, engagement, next] = events()
    expect(engagement).toMatchObject({
      type: 'engagement',
      engagementMs: 12_000,
    })
    expect(next).toMatchObject({
      type: 'page_view',
      path: '/ko/session',
      sequence: 2,
      isSessionStart: false,
    })
    expect(next).not.toHaveProperty('referrer')
  })

  it('pauses while hidden and flushes engagement on hide', () => {
    const t = start()
    t.trackPageView()
    now = 4_000
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(events().at(-1)).toMatchObject({
      type: 'engagement',
      engagementMs: 4_000,
    })

    now = 100_000
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
    document.dispatchEvent(new Event('visibilitychange'))
    now = 101_000
    window.dispatchEvent(new Event('pagehide'))
    expect(events().at(-1)).toMatchObject({
      type: 'engagement',
      engagementMs: 5_000,
    })
  })

  it('marks a 404 page view from the not-found marker', () => {
    document.body.innerHTML = '<span hidden data-analytics-not-found></span>'
    start().trackPageView()
    expect(events()[0]).toMatchObject({ isNotFound: true })
  })

  it('records CTA and outbound clicks with the current page view', () => {
    document.body.innerHTML = `
      <a id="cta" href="/ko/calendar" data-analytics="join_calendar"><span id="inner">Calendar</span></a>
      <a id="out" href="https://www.linkedin.com/company/gdsc-yonsei/">LinkedIn</a>
      <a id="internal" href="/ko/project">Projects</a>`
    const t = start()
    t.trackPageView()
    for (const id of ['inner', 'out', 'internal']) {
      document
        .getElementById(id)!
        .addEventListener('click', (event) => event.preventDefault())
      document.getElementById(id)!.click()
    }
    window.dispatchEvent(new Event('pagehide'))

    const clicks = events().filter((event) => event.type === 'click')
    expect(clicks).toEqual([
      expect.objectContaining({
        kind: 'cta',
        label: 'join_calendar',
        targetUrl: '/ko/calendar',
        path: '/ko',
      }),
      expect.objectContaining({
        kind: 'outbound',
        targetUrl: 'https://www.linkedin.com/company/gdsc-yonsei/',
      }),
    ])
  })

  it('forwards known web vitals and drops unknown metrics', () => {
    const t = start()
    t.trackPageView()
    t.reportWebVital({ name: 'LCP', value: 1800, rating: 'good' })
    t.reportWebVital({ name: 'FID', value: 10, rating: 'good' })
    t.reportWebVital({ name: 'CLS', value: 0.3 })
    window.dispatchEvent(new Event('pagehide'))
    expect(events().filter((event) => event.type === 'web_vital')).toEqual([
      expect.objectContaining({
        metric: 'LCP',
        value: 1800,
        rating: 'good',
        path: '/ko',
      }),
    ])
  })

  it('sends nothing after the visitor opts out', () => {
    const storage = memoryStorage()
    storage.setItem('gyms_optout', '1')
    const t = start(storage)
    t.trackPageView()
    window.dispatchEvent(new Event('pagehide'))
    expect(sent).toEqual([])
  })
})
