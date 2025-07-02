'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePerformanceTracker } from '@/lib/hooks/use-performance-tracker'

interface PerformanceSummary {
  avgLcp: number | null | undefined
  avgInp: number | null | undefined
  avgCls: number | null | undefined
  avgFcp: number | null | undefined
  avgTtfb: number | null | undefined
  avgLoadTime: number | null | undefined
  sampleCount: number | null | undefined
}

interface DeviceStats {
  deviceType: string
  avgLcp: number
  avgFcp: number
  count: number
}

interface BrowserStats {
  browserName: string
  avgLcp: number
  avgFcp: number
  count: number
}

interface RecentMetric {
  id: string
  url: string
  pageTitle: string
  lcp?: number
  inp?: number
  cls?: number
  fcp?: number
  ttfb?: number
  deviceType: string
  browserName: string
  createdAt: string
}

interface PerformanceData {
  summary: PerformanceSummary | null
  deviceStats: DeviceStats[]
  browserStats: BrowserStats[]
  recentMetrics: RecentMetric[]
  dateRange: {
    startDate: string
    endDate: string
    days: number
  }
}

export default function PerformancePage() {
  const [data, setData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(7)
  const [isCollectingMetrics, setIsCollectingMetrics] = useState(false)

  // 실시간 성능 측정을 위한 훅
  const { collectMetrics } = usePerformanceTracker({
    enabled: true,
    sendImmediately: true,
    debug: true,
  })

  const fetchPerformanceData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/performance/summary?days=${days}`)
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error)
      }
    } catch (err) {
      console.error(err)
      setError('Failed to fetch performance data')
    } finally {
      setLoading(false)
    }
  }, [days])

  // 실시간 성능 측정 함수
  const handleRealTimeCollection = useCallback(async () => {
    if (isCollectingMetrics) return

    setIsCollectingMetrics(true)
    try {
      await collectMetrics()
      // 측정 후 잠시 기다린 다음 데이터 새로고침
      setTimeout(() => {
        fetchPerformanceData()
      }, 2000)
    } catch (error) {
      console.error('실시간 성능 측정 실패:', error)
    } finally {
      setIsCollectingMetrics(false)
    }
  }, [isCollectingMetrics, collectMetrics, fetchPerformanceData])

  useEffect(() => {
    fetchPerformanceData()
  }, [fetchPerformanceData])

  const formatMs = (ms: number | null | undefined) => {
    if (ms === null || ms === undefined) return 'N/A'
    return `${Math.round(ms)}ms`
  }

  const formatScore = (score: number | null | undefined) => {
    if (score === null || score === undefined) return 'N/A'
    return score.toFixed(3)
  }

  const getPerformanceGrade = (
    metric: string,
    value: number | null | undefined
  ) => {
    if (value === null || value === undefined) return 'unknown'

    switch (metric) {
      case 'lcp':
        return value <= 2500
          ? 'good'
          : value <= 4000
            ? 'needs-improvement'
            : 'poor'
      case 'inp':
        return value <= 200
          ? 'good'
          : value <= 500
            ? 'needs-improvement'
            : 'poor'
      case 'cls':
        return value <= 0.1
          ? 'good'
          : value <= 0.25
            ? 'needs-improvement'
            : 'poor'
      case 'fcp':
        return value <= 1800
          ? 'good'
          : value <= 3000
            ? 'needs-improvement'
            : 'poor'
      case 'ttfb':
        return value <= 800
          ? 'good'
          : value <= 1800
            ? 'needs-improvement'
            : 'poor'
      default:
        return 'unknown'
    }
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'good':
        return 'text-green-600 bg-green-100'
      case 'needs-improvement':
        return 'text-orange-600 bg-orange-100'
      case 'poor':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-8 text-3xl font-bold">웹사이트 성능 분석</h1>
          <div className="py-12 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">성능 데이터를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-8 text-3xl font-bold">웹사이트 성능 분석</h1>
          <div className="py-12 text-center">
            <p className="text-red-600">오류: {error}</p>
            <button
              onClick={fetchPerformanceData}
              className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
          <h1 className="text-3xl font-bold">웹사이트 성능 분석</h1>
          <div className="flex flex-wrap items-center space-x-4">
            <label className="text-sm font-medium">기간:</label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded border px-3 py-1 text-sm"
            >
              <option value={1}>1일</option>
              <option value={7}>7일</option>
              <option value={30}>30일</option>
              <option value={90}>90일</option>
            </select>
            <button
              onClick={fetchPerformanceData}
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              새로고침
            </button>
            <button
              onClick={handleRealTimeCollection}
              disabled={isCollectingMetrics}
              className={`rounded px-4 py-2 text-sm transition-colors ${
                isCollectingMetrics
                  ? 'cursor-not-allowed bg-gray-400 text-gray-200'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isCollectingMetrics ? '🔄 측정 중...' : '📊 실시간 측정'}
            </button>
          </div>
        </div>

        {/* 실시간 측정 안내 */}
        {isCollectingMetrics && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center">
              <div className="mr-3 h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="text-blue-800">
                현재 페이지의 성능을 실시간으로 측정하고 있습니다. 측정 완료 후
                자동으로 데이터가 업데이트됩니다.
              </p>
            </div>
          </div>
        )}

        {data && (
          <>
            {/* Core Web Vitals 요약 */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="mb-1 text-sm font-medium text-gray-500">
                  LCP (Largest Contentful Paint)
                </h3>
                <div className="flex flex-col items-center justify-between">
                  <span className="text-2xl font-bold">
                    {formatMs(data.summary?.avgLcp)}
                  </span>
                  <span
                    className={`rounded px-2 py-1 text-xs font-medium ${getGradeColor(getPerformanceGrade('lcp', data.summary?.avgLcp))}`}
                  >
                    {getPerformanceGrade(
                      'lcp',
                      data.summary?.avgLcp
                    ).toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="mb-1 text-sm font-medium text-gray-500">
                  INP (Interaction to Next Paint)
                </h3>
                <div className="flex flex-col items-center justify-between">
                  <span className="text-2xl font-bold">
                    {formatMs(data.summary?.avgInp)}
                  </span>
                  <span
                    className={`rounded px-2 py-1 text-xs font-medium ${getGradeColor(getPerformanceGrade('inp', data.summary?.avgInp))}`}
                  >
                    {getPerformanceGrade(
                      'inp',
                      data.summary?.avgInp
                    ).toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="mb-1 text-sm font-medium text-gray-500">
                  CLS (Cumulative Layout Shift)
                </h3>
                <div className="flex flex-col items-center justify-between">
                  <span className="text-2xl font-bold">
                    {formatScore(data.summary?.avgCls)}
                  </span>
                  <span
                    className={`rounded px-2 py-1 text-xs font-medium ${getGradeColor(getPerformanceGrade('cls', data.summary?.avgCls))}`}
                  >
                    {getPerformanceGrade(
                      'cls',
                      data.summary?.avgCls
                    ).toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="mb-1 text-sm font-medium text-gray-500">
                  FCP (First Contentful Paint)
                </h3>
                <div className="flex flex-col items-center justify-between">
                  <span className="text-2xl font-bold">
                    {formatMs(data.summary?.avgFcp)}
                  </span>
                  <span
                    className={`rounded px-2 py-1 text-xs font-medium ${getGradeColor(getPerformanceGrade('fcp', data.summary?.avgFcp))}`}
                  >
                    {getPerformanceGrade(
                      'fcp',
                      data.summary?.avgFcp
                    ).toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="mb-1 text-sm font-medium text-gray-500">
                  TTFB (Time to First Byte)
                </h3>
                <div className="flex flex-col items-center justify-between">
                  <span className="text-2xl font-bold">
                    {formatMs(data.summary?.avgTtfb)}
                  </span>
                  <span
                    className={`rounded px-2 py-1 text-xs font-medium ${getGradeColor(getPerformanceGrade('ttfb', data.summary?.avgTtfb))}`}
                  >
                    {getPerformanceGrade(
                      'ttfb',
                      data.summary?.avgTtfb
                    ).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* 디바이스별 성능 */}
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="mb-4 text-lg font-semibold">디바이스별 성능</h3>
                <div className="space-y-3">
                  {data.deviceStats.map((device) => (
                    <div
                      key={device.deviceType}
                      className="flex items-center justify-between rounded bg-gray-50 p-3"
                    >
                      <div>
                        <span className="font-medium capitalize">
                          {device.deviceType}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          ({device.count} 샘플)
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">
                          LCP: {formatMs(device.avgLcp)}
                        </div>
                        <div className="text-sm">
                          FCP: {formatMs(device.avgFcp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="mb-4 text-lg font-semibold">브라우저별 성능</h3>
                <div className="space-y-3">
                  {data.browserStats.map((browser) => (
                    <div
                      key={browser.browserName}
                      className="flex items-center justify-between rounded bg-gray-50 p-3"
                    >
                      <div>
                        <span className="font-medium">
                          {browser.browserName}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          ({browser.count} 샘플)
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">
                          LCP: {formatMs(browser.avgLcp)}
                        </div>
                        <div className="text-sm">
                          FCP: {formatMs(browser.avgFcp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 요약 정보 */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-semibold">분석 요약</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <span className="text-sm text-gray-500">총 샘플 수</span>
                  <div className="text-2xl font-bold">
                    {data.summary?.sampleCount || 0}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">평균 로드 시간</span>
                  <div className="text-2xl font-bold">
                    {formatMs(data.summary?.avgLoadTime)}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">분석 기간</span>
                  <div className="text-lg">{data.dateRange.days}일</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
