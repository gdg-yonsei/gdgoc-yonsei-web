'use client'

/**
 * 공개 사이트 방문 분석 수집기. 화면에는 아무것도 그리지 않는다.
 * usePathname은 경로 변경 신호로만 쓰고 실제 경로는 location에서 읽는다(proxy rewrite 뒤 경로가 다를 수 있음).
 * cacheComponents에서 usePathname이 일시 중단될 수 있어 레이아웃이 <Suspense>로 감싼다.
 */
import { usePathname } from 'next/navigation'
import { useReportWebVitals } from 'next/web-vitals'
import { useEffect } from 'react'
import { getBrowserTracker } from '@/lib/analytics/tracker/browser'
import type { WebVitalReport } from '@/lib/analytics/tracker/tracker'

// 콜백 참조가 바뀌면 지난 지표가 다시 보고되므로 모듈 수준 함수로 둔다.
function reportWebVital(metric: WebVitalReport) {
  getBrowserTracker()?.reportWebVital(metric)
}

export default function AnalyticsTracker() {
  const pathname = usePathname()
  useReportWebVitals(reportWebVital)

  useEffect(() => {
    getBrowserTracker()?.trackPageView()
  }, [pathname])

  return null
}
