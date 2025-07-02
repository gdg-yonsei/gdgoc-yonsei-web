'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePerformanceTracker } from '@/lib/hooks/use-performance-tracker'

// Window 인터페이스 확장
declare global {
  interface Window {
    __collectPerformanceMetrics?: () => Promise<void>
  }
}

interface PerformanceTrackerProps {
  userId?: string
  enabled?: boolean
  debug?: boolean
  showDashboard?: boolean
}

export function PerformanceTracker({
  userId,
  enabled = true,
  debug = false,
  showDashboard = false,
}: PerformanceTrackerProps) {
  const { collectMetrics } = usePerformanceTracker({
    userId,
    enabled,
    sendImmediately: true,
    debug,
  })

  const [isCollecting, setIsCollecting] = useState(false)
  const [lastCollected, setLastCollected] = useState<Date | null>(null)

  // 수동 메트릭 수집 함수
  const handleManualCollection = useCallback(async () => {
    if (isCollecting) return

    setIsCollecting(true)
    try {
      await collectMetrics()
      setLastCollected(new Date())
      if (debug) {
        console.log('Manual performance metrics collected at:', new Date())
      }
    } catch (error) {
      console.error('Failed to collect metrics manually:', error)
    } finally {
      setIsCollecting(false)
    }
  }, [isCollecting, collectMetrics, debug])

  // 주기적 자동 수집 (디버그 모드에서)
  useEffect(() => {
    if (!debug || !enabled) return

    const interval = setInterval(() => {
      handleManualCollection()
    }, 30000) // 30초마다 자동 수집

    return () => clearInterval(interval)
  }, [debug, enabled, handleManualCollection])

  useEffect(() => {
    if (debug) {
      console.log('Performance tracker initialized', {
        userId,
        enabled,
        showDashboard,
      })

      // 전역 함수로 수동 수집 기능 노출 (개발 환경에서)
      if (typeof window !== 'undefined') {
        window.__collectPerformanceMetrics = handleManualCollection
      }
    }
  }, [debug, userId, enabled, showDashboard, handleManualCollection])

  // 대시보드 표시가 요청된 경우에만 렌더링
  if (showDashboard && debug) {
    return (
      <PerformanceDashboard
        onManualCollect={handleManualCollection}
        isCollecting={isCollecting}
        lastCollected={lastCollected}
      />
    )
  }

  // 기본적으로는 UI를 렌더링하지 않음
  return null
}

// 개발자 도구용 성능 대시보드 컴포넌트
interface PerformanceDashboardProps {
  onManualCollect: () => void
  isCollecting: boolean
  lastCollected: Date | null
}

export function PerformanceDashboard({
  onManualCollect,
  isCollecting,
  lastCollected,
}: PerformanceDashboardProps) {
  return (
    <div className="bg-opacity-90 fixed right-4 bottom-4 z-50 min-w-64 rounded-lg bg-black p-4 text-xs text-white">
      <h3 className="mb-3 font-bold text-green-400">🚀 Performance Monitor</h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span>Status:</span>
          <span className="text-green-400">✓ Active</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Auto-collect:</span>
          <span className="text-blue-400">📊 30s interval</span>
        </div>
        {lastCollected && (
          <div className="text-xs text-gray-300">
            Last: {lastCollected.toLocaleTimeString()}
          </div>
        )}
        <button
          onClick={onManualCollect}
          disabled={isCollecting}
          className={`w-full rounded px-3 py-2 text-xs font-medium transition-colors ${
            isCollecting
              ? 'cursor-not-allowed bg-gray-600 text-gray-400'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isCollecting ? '🔄 수집 중...' : '📊 지금 측정하기'}
        </button>
        <div className="mt-2 text-xs text-gray-400">
          Console: window.__collectPerformanceMetrics()
        </div>
      </div>
    </div>
  )
}
