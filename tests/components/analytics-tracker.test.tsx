import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const pathname = vi.hoisted(() => ({ value: '/ko' }))

vi.mock('next/navigation', () => ({ usePathname: () => pathname.value }))
vi.mock('next/web-vitals', () => ({ useReportWebVitals: vi.fn() }))

import AnalyticsTracker from '@/app/components/site/analytics-tracker'

// jsdom의 Blob 본문 읽기에 기대지 않으려고 전송 본문 문자열을 그대로 보관하는 대역을 쓴다.
class TextBlob {
  constructor(readonly parts: string[]) {}
}
const sendBeacon = vi.fn<(url: string, body: TextBlob) => boolean>(() => true)

beforeEach(() => {
  localStorage.clear()
  window.history.replaceState(null, '', '/ko')
  vi.stubGlobal('Blob', TextBlob)
  Object.defineProperty(navigator, 'sendBeacon', {
    configurable: true,
    value: sendBeacon,
  })
})

afterEach(() => {
  sendBeacon.mockClear()
  vi.unstubAllGlobals()
})

describe('AnalyticsTracker', () => {
  it('reports a page view on mount and on every pathname change', () => {
    const { rerender } = render(<AnalyticsTracker />)
    expect(sendBeacon).toHaveBeenCalledTimes(1)

    window.history.pushState(null, '', '/ko/session')
    pathname.value = '/ko/session'
    rerender(<AnalyticsTracker />)

    const pageViews = sendBeacon.mock.calls
      .map(([, blob]) => blob.parts.join(''))
      .flatMap(
        (body) =>
          (
            JSON.parse(body) as {
              events: Array<{ type: string; path?: string }>
            }
          ).events
      )
      .filter((event) => event.type === 'page_view')
    expect(pageViews.map((event) => event.path)).toEqual(['/ko', '/ko/session'])
  })
})
