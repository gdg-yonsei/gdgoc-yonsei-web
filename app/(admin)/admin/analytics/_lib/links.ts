/** 분석 화면 사이의 링크. 현재 필터를 그대로 들고 간다. */
import { localizeAdminHref } from '@/lib/admin-i18n'
import {
  analyticsFilterToSearchParams,
  type AnalyticsFilter,
} from '@/lib/analytics/filters'
import type { Locale } from '@/lib/i18n'

/** 페이지 경로에 슬래시가 있어 세그먼트 대신 `page` 쿼리로 넘긴다. */
export function pageDetailHref(
  path: string,
  filter: AnalyticsFilter,
  locale: Locale
): string {
  const params = analyticsFilterToSearchParams(filter)
  params.set('page', path)
  return `${localizeAdminHref('/admin/analytics/engagement/page-detail', locale)}?${params}`
}
