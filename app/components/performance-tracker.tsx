'use client'

import { useEffect } from 'react'
import { usePerformanceTracker } from '@/lib/hooks/use-performance-tracker'

interface PerformanceTrackerProps {
  userId?: string
  enabled?: boolean
  debug?: boolean
}

export function PerformanceTracker({
  userId,
  enabled = true,
  debug = false,
}: PerformanceTrackerProps) {
  const { collectMetrics } = usePerformanceTracker({
    userId,
    enabled,
    sendImmediately: true,
    debug,
  })

  useEffect(() => {
    if (debug) {
      console.log('Performance tracker initialized', { userId, enabled })
    }
  }, [debug, userId, enabled])

  // 이 컴포넌트는 UI를 렌더링하지 않고 성능 추적만 담당
  return null
}

// 개발자 도구용 성능 대시보드 컴포넌트
export function PerformanceDashboard() {
  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-xs z-50">
      <h3 className="font-bold mb-2">Performance Monitor</h3>
      <div className="space-y-1">
        <div>성능 데이터 수집 중...</div>
        <div className="text-green-400">✓ Web Vitals 활성화</div>
        <div className="text-blue-400">📊 실시간 모니터링</div>
      </div>
    </div>
  )
}
