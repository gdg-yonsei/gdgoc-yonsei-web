'use client'

import { useEffect, useCallback } from 'react'
import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals'

// Navigator 인터페이스 확장 (네트워크 연결 정보용)
interface NetworkConnection {
  type?: string
  effectiveType?: string
}

interface ExtendedNavigator extends Navigator {
  connection?: NetworkConnection
  mozConnection?: NetworkConnection
  webkitConnection?: NetworkConnection
}

interface PerformanceMetric {
  name: string
  value: number
  id: string
  delta?: number
}

interface DeviceInfo {
  userAgent: string
  deviceType: 'mobile' | 'desktop' | 'tablet'
  screenResolution: string
  viewport: string
  browserName: string
  browserVersion: string
}

interface NetworkInfo {
  connectionType?: string
  effectiveType?: string
}

interface PerformanceData {
  url: string
  pageTitle: string
  userId?: string
  sessionId?: string
  lcp?: number
  inp?: number
  cls?: number
  fcp?: number
  ttfb?: number
  tti?: number
  domContentLoadedTime?: number
  loadTime?: number
  firstPaintTime?: number
  connectionType?: string
  effectiveType?: string
  userAgent: string
  deviceType: string
  screenResolution: string
  viewport: string
  browserName: string
  browserVersion: string
  country?: string
  region?: string
}

function getDeviceInfo(): DeviceInfo {
  const userAgent = navigator.userAgent

  // 디바이스 타입 감지
  let deviceType: 'mobile' | 'desktop' | 'tablet' = 'desktop'
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    deviceType = 'tablet'
  } else if (
    /mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(
      userAgent
    )
  ) {
    deviceType = 'mobile'
  }

  // 화면 해상도
  const screenResolution = `${screen.width}x${screen.height}`

  // 뷰포트 크기
  const viewport = `${window.innerWidth}x${window.innerHeight}`

  // 브라우저 정보
  let browserName = 'Unknown'
  let browserVersion = 'Unknown'

  if (userAgent.includes('Chrome')) {
    browserName = 'Chrome'
    const match = userAgent.match(/Chrome\/([0-9.]+)/)
    if (match) browserVersion = match[1]
  } else if (userAgent.includes('Firefox')) {
    browserName = 'Firefox'
    const match = userAgent.match(/Firefox\/([0-9.]+)/)
    if (match) browserVersion = match[1]
  } else if (userAgent.includes('Safari')) {
    browserName = 'Safari'
    const match = userAgent.match(/Version\/([0-9.]+)/)
    if (match) browserVersion = match[1]
  } else if (userAgent.includes('Edge')) {
    browserName = 'Edge'
    const match = userAgent.match(/Edge\/([0-9.]+)/)
    if (match) browserVersion = match[1]
  }

  return {
    userAgent,
    deviceType,
    screenResolution,
    viewport,
    browserName,
    browserVersion,
  }
}

function getNetworkInfo(): NetworkInfo {
  const extendedNavigator = navigator as ExtendedNavigator
  const connection =
    extendedNavigator.connection ||
    extendedNavigator.mozConnection ||
    extendedNavigator.webkitConnection

  if (connection) {
    return {
      connectionType: connection.type,
      effectiveType: connection.effectiveType,
    }
  }

  return {}
}

function getAdditionalPerformanceMetrics() {
  const navigation = performance.getEntriesByType(
    'navigation'
  )[0] as PerformanceNavigationTiming
  const paint = performance.getEntriesByType('paint')

  let tti: number | undefined
  let domContentLoadedTime: number | undefined
  let loadTime: number | undefined
  let firstPaintTime: number | undefined

  if (navigation) {
    // 유효한 값만 저장 (0 이상)
    const dcl =
      navigation.domContentLoadedEventEnd -
      navigation.domContentLoadedEventStart
    domContentLoadedTime = dcl >= 0 ? dcl : undefined

    const lt = navigation.loadEventEnd - navigation.loadEventStart
    loadTime = lt >= 0 ? lt : undefined

    // TTI 근사치 계산 (정확한 TTI는 복잡한 알고리즘이 필요함)
    const ttiValue = navigation.domContentLoadedEventEnd - navigation.fetchStart
    tti = ttiValue > 0 ? ttiValue : undefined
  }

  const firstPaint = paint.find((entry) => entry.name === 'first-paint')
  if (firstPaint && firstPaint.startTime >= 0) {
    firstPaintTime = firstPaint.startTime
  }

  return {
    tti,
    domContentLoadedTime,
    loadTime,
    firstPaintTime,
  }
}

// 성능 데이터 검증 함수
function validatePerformanceData(
  data: Partial<PerformanceData>
): data is PerformanceData {
  // 필수 필드 검증
  if (!data.url || !data.userAgent || !data.deviceType) {
    return false
  }

  // 숫자 필드들의 유효성 검증
  const numericFields: (keyof PerformanceData)[] = [
    'lcp',
    'inp',
    'cls',
    'fcp',
    'ttfb',
    'tti',
    'domContentLoadedTime',
    'loadTime',
    'firstPaintTime',
  ]

  for (const field of numericFields) {
    const value = data[field]
    if (
      value !== undefined &&
      (typeof value !== 'number' ||
        isNaN(value) ||
        !isFinite(value) ||
        value < 0)
    ) {
      console.warn(`Invalid ${field} value:`, value)
      // 잘못된 값은 제거
      delete data[field]
    }
  }

  return true
}

async function sendPerformanceData(data: PerformanceData) {
  try {
    // 데이터 유효성 검사
    if (!validatePerformanceData(data)) {
      console.warn('Invalid performance data, skipping send:', data)
      return
    }

    // AbortController로 타임아웃 설정
    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), 10000) // 10초 타임아웃

    const response = await fetch('/api/performance/metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal: abortController.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      let errorData = {}
      try {
        errorData = await response.json()
      } catch (parseError) {
        console.warn('Failed to parse error response:', parseError)
      }
      console.error(
        'Failed to send performance data:',
        response.status,
        errorData
      )
    }
  } catch (error) {
    // 네트워크 에러 타입별 처리
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn('Performance data request timed out')
      } else if (error.message.includes('fetch')) {
        console.warn(
          'Network error while sending performance data:',
          error.message
        )
      } else {
        console.error('Failed to send performance data:', error)
      }
    } else {
      console.error('Failed to send performance data:', error)
    }
  }
}

export function usePerformanceTracker(options?: {
  userId?: string
  enabled?: boolean
  sendImmediately?: boolean
  debug?: boolean
}) {
  const {
    userId,
    enabled = true,
    sendImmediately = true,
    debug = false,
  } = options || {}

  const collectAndSendMetrics = useCallback(async () => {
    if (!enabled) return

    const deviceInfo = getDeviceInfo()
    const networkInfo = getNetworkInfo()
    const additionalMetrics = getAdditionalPerformanceMetrics()

    const baseData: Partial<PerformanceData> = {
      url: window.location.href,
      pageTitle: document.title,
      userId,
      sessionId: crypto.randomUUID(), // 페이지 세션 ID
      ...deviceInfo,
      ...networkInfo,
      ...additionalMetrics,
    }

    // Web Vitals 수집
    const metricsCollected: Record<string, number> = {}

    const onMetric = (metric: PerformanceMetric) => {
      // 유효한 메트릭 값만 저장 (숫자이고 0 이상이며 유한한 값)
      if (
        typeof metric.value === 'number' &&
        !isNaN(metric.value) &&
        isFinite(metric.value) &&
        metric.value >= 0
      ) {
        metricsCollected[metric.name.toLowerCase()] = metric.value
      } else if (debug) {
        console.warn('Invalid metric value:', metric.name, metric.value)
      }

      // 모든 주요 메트릭이 수집되면 전송
      const requiredMetrics = ['lcp', 'inp', 'cls', 'fcp', 'ttfb']
      const collectedCount = requiredMetrics.filter(
        (name) => name in metricsCollected
      ).length

      if (sendImmediately || collectedCount >= 3) {
        const finalData: PerformanceData = {
          ...baseData,
          ...metricsCollected,
        } as PerformanceData

        // 기본 필수 데이터가 있는지 확인
        if (finalData.url && finalData.userAgent && finalData.deviceType) {
          if (debug) {
            console.log('Sending performance data:', finalData)
          }
          sendPerformanceData(finalData)
        } else if (debug) {
          console.warn('Missing required data, skipping send:', finalData)
        }
      }
    }

    // Web Vitals 메트릭 수집
    onCLS(onMetric)
    onFCP(onMetric)
    onLCP(onMetric)
    onTTFB(onMetric)
    onINP(onMetric)
  }, [enabled, userId, sendImmediately, debug])

  useEffect(() => {
    if (!enabled) return

    // 페이지 로드 완료 후 메트릭 수집
    const startCollection = () => {
      // DOM과 필수 API가 사용 가능한지 확인
      if (
        typeof window !== 'undefined' &&
        window.performance &&
        document.title
      ) {
        // 약간의 지연을 두어 모든 리소스가 로드되도록 함
        setTimeout(collectAndSendMetrics, 100)
      }
    }

    if (document.readyState === 'complete') {
      startCollection()
    } else {
      window.addEventListener('load', startCollection)
      return () => window.removeEventListener('load', startCollection)
    }
  }, [collectAndSendMetrics, enabled])

  // 페이지 unload 시에도 메트릭 전송
  useEffect(() => {
    if (!enabled) return

    const handleBeforeUnload = () => {
      try {
        // sendBeacon을 사용하여 페이지 떠날 때도 데이터 전송
        const deviceInfo = getDeviceInfo()
        const networkInfo = getNetworkInfo()
        const additionalMetrics = getAdditionalPerformanceMetrics()

        const data = {
          url: window.location.href,
          pageTitle: document.title,
          userId,
          sessionId: crypto.randomUUID(),
          ...deviceInfo,
          ...networkInfo,
          ...additionalMetrics,
        }

        // 데이터 유효성 검사
        if (!data.url || !data.userAgent || !data.deviceType) {
          return
        }

        // Blob으로 JSON 데이터를 래핑하여 Content-Type 설정
        const blob = new Blob([JSON.stringify(data)], {
          type: 'application/json',
        })

        navigator.sendBeacon('/api/performance/metrics', blob)
      } catch (error) {
        console.error('Failed to send performance data on unload:', error)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [enabled, userId])

  return {
    collectMetrics: collectAndSendMetrics,
  }
}
