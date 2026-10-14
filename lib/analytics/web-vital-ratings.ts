/** Core Web Vitals 등급 기준(web.dev). 수집기와 대시보드가 같이 쓴다. good 이하면 좋음, poor 초과면 나쁨. */
import type { WebVitalName, WebVitalRating } from '@/lib/analytics/events'

export const WEB_VITAL_THRESHOLDS: Record<
  WebVitalName,
  { good: number; poor: number; unit: 'ms' | 'score' }
> = {
  LCP: { good: 2500, poor: 4000, unit: 'ms' },
  INP: { good: 200, poor: 500, unit: 'ms' },
  CLS: { good: 0.1, poor: 0.25, unit: 'score' },
  FCP: { good: 1800, poor: 3000, unit: 'ms' },
  TTFB: { good: 800, poor: 1800, unit: 'ms' },
}

export function rateWebVital(
  metric: WebVitalName,
  value: number
): WebVitalRating {
  const threshold = WEB_VITAL_THRESHOLDS[metric]
  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}
