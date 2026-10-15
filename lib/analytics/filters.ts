/** 분석 화면의 필터 모델. URL 쿼리와 오가며, 잘못된 값은 오류 대신 기본값으로 되돌린다(공유 링크가 깨져도 화면은 열린다). */
import { CHANNELS, type Channel } from '@/lib/analytics/constants'
import {
  CONTENT_GROUPS,
  type ContentGroup,
} from '@/lib/analytics/content-groups'

export const RANGE_PRESETS = [
  'today',
  'yesterday',
  '7d',
  '28d',
  '90d',
  '12m',
  'custom',
] as const
export type RangePreset = (typeof RANGE_PRESETS)[number]

export const DEVICE_TYPES = ['mobile', 'tablet', 'desktop'] as const
export type DeviceTypeFilter = (typeof DEVICE_TYPES)[number]

export type AnalyticsFilter = {
  range: RangePreset
  /** `range`가 custom일 때만 쓰는 서울 날짜(YYYY-MM-DD, 양 끝 포함). */
  from: string | null
  to: string | null
  compare: boolean
  channel: Channel | null
  device: DeviceTypeFilter | null
  /** ISO 3166 두 글자, 대문자. */
  country: string | null
  locale: 'ko' | 'en' | null
  visitor: 'new' | 'returning' | null
  contentGroup: ContentGroup | null
  /** 페이지 경로에 포함된 글자(와일드카드 아님). */
  path: string | null
  includeInternal: boolean
}

export const DEFAULT_ANALYTICS_FILTER: AnalyticsFilter = {
  range: '28d',
  from: null,
  to: null,
  compare: true,
  channel: null,
  device: null,
  country: null,
  locale: null,
  visitor: null,
  contentGroup: null,
  path: null,
  includeInternal: false,
}

export type SearchParamsRecord = Record<string, string | string[] | undefined>

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function single(params: SearchParamsRecord, key: string): string | null {
  const value = params[key]
  return typeof value === 'string' && value.length > 0 ? value : null
}

function oneOf<T extends string>(
  value: string | null,
  options: readonly T[]
): T | null {
  return value !== null && (options as readonly string[]).includes(value)
    ? (value as T)
    : null
}

function validDate(value: string | null): string | null {
  if (!value || !DATE_PATTERN.test(value)) return null
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
    ? null
    : value
}

export function parseAnalyticsFilter(
  params: SearchParamsRecord
): AnalyticsFilter {
  const range =
    oneOf(single(params, 'range'), RANGE_PRESETS) ??
    DEFAULT_ANALYTICS_FILTER.range
  const country = single(params, 'country')?.toUpperCase() ?? null
  const path = single(params, 'path')?.trim().slice(0, 200) || null

  return {
    range,
    from: range === 'custom' ? validDate(single(params, 'from')) : null,
    to: range === 'custom' ? validDate(single(params, 'to')) : null,
    compare: single(params, 'compare') !== '0',
    channel: oneOf(single(params, 'channel'), CHANNELS),
    device: oneOf(single(params, 'device'), DEVICE_TYPES),
    country: country && /^[A-Z]{2}$/.test(country) ? country : null,
    locale: oneOf(single(params, 'locale'), ['ko', 'en'] as const),
    visitor: oneOf(single(params, 'visitor'), ['new', 'returning'] as const),
    contentGroup: oneOf(single(params, 'group'), CONTENT_GROUPS),
    path,
    includeInternal: single(params, 'internal') === '1',
  }
}

/** 기본값과 같은 항목은 빼서 공유 링크를 짧게 유지한다. */
export function analyticsFilterToSearchParams(
  filter: AnalyticsFilter
): URLSearchParams {
  const params = new URLSearchParams()
  if (filter.range !== DEFAULT_ANALYTICS_FILTER.range)
    params.set('range', filter.range)
  if (filter.range === 'custom' && filter.from) params.set('from', filter.from)
  if (filter.range === 'custom' && filter.to) params.set('to', filter.to)
  if (!filter.compare) params.set('compare', '0')
  if (filter.channel) params.set('channel', filter.channel)
  if (filter.device) params.set('device', filter.device)
  if (filter.country) params.set('country', filter.country)
  if (filter.locale) params.set('locale', filter.locale)
  if (filter.visitor) params.set('visitor', filter.visitor)
  if (filter.contentGroup) params.set('group', filter.contentGroup)
  if (filter.path) params.set('path', filter.path)
  if (filter.includeInternal) params.set('internal', '1')
  return params
}
