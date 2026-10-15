/** 분석 화면의 숫자·비율·시간 표시. 큰 값은 압축(12.9K)하고 표와 축은 같은 형식을 쓴다. */
import type { WebVitalName } from '@/lib/analytics/events'
import { WEB_VITAL_THRESHOLDS } from '@/lib/analytics/metrics'
import { toIntlLocale, type Locale } from '@/lib/i18n'

export function formatNumber(value: number, locale: Locale): string {
  const options: Intl.NumberFormatOptions =
    Math.abs(value) >= 10_000
      ? { notation: 'compact', maximumFractionDigits: 1 }
      : { maximumFractionDigits: 1 }
  return new Intl.NumberFormat(toIntlLocale(locale), options).format(value)
}

export function formatPercent(value: number, locale: Locale): string {
  return new Intl.NumberFormat(toIntlLocale(locale), {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatSignedPercent(
  value: number | null,
  locale: Locale
): string | null {
  if (value === null) return null
  const formatted = formatPercent(Math.abs(value), locale)
  return `${value < 0 ? '-' : '+'}${formatted}`
}

export function formatDuration(seconds: number): string {
  const rounded = Math.round(seconds)
  if (rounded < 60) return `${rounded}s`
  return `${Math.floor(rounded / 60)}m ${String(rounded % 60).padStart(2, '0')}s`
}

/** 구간 키(YYYY-MM-DD 또는 YYYY-MM-DDTHH)를 축 라벨로. */
export function formatBucketLabel(bucket: string, locale: Locale): string {
  if (bucket.length === 13) {
    const hour = bucket.slice(11, 13)
    return locale === 'ko' ? `${hour}시` : `${hour}:00`
  }
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${bucket}T00:00:00Z`))
}

export function formatVital(
  metric: WebVitalName,
  value: number | null
): string {
  if (value === null) return '—'
  if (WEB_VITAL_THRESHOLDS[metric].unit === 'score') return value.toFixed(2)
  return value >= 1000
    ? `${(value / 1000).toFixed(2)} s`
    : `${Math.round(value)} ms`
}
