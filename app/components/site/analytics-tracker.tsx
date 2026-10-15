'use client'

/**
 * 공개 사이트 방문 분석 수집기. 화면에는 아무것도 그리지 않는다.
 * usePathname은 경로 변경 신호로만 쓰고 실제 경로는 location에서 읽는다(proxy rewrite 뒤 경로가 다를 수 있음).
 * cacheComponents에서 usePathname이 일시 중단될 수 있어 레이아웃이 <Suspense>로 감싼다.
 * Web Vitals는 트래커를 만들 때 함께 관찰한다(lib/analytics/tracker/web-vitals.ts).
 */
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { getBrowserTracker } from '@/lib/analytics/tracker/browser'

export default function AnalyticsTracker() {
  const pathname = usePathname()
  useEffect(() => {
    getBrowserTracker()?.trackPageView()
  }, [pathname])

  return null
}
