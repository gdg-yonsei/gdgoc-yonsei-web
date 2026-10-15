/** 현재 필터를 그대로 붙인 CSV 내려받기 링크. 내려받기라 클라이언트 라우터를 쓰지 않는 일반 <a>다. */
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import {
  analyticsFilterToSearchParams,
  type AnalyticsFilter,
} from '@/lib/analytics/filters'
import type { AnalyticsTableReport } from '@/lib/server/services/admin/analytics'

export default function CsvLink({
  report,
  filter,
  label,
  extra,
}: {
  report: AnalyticsTableReport
  filter: AnalyticsFilter
  label: string
  extra?: Record<string, string>
}) {
  const params = new URLSearchParams({ report })
  analyticsFilterToSearchParams(filter).forEach((value, key) =>
    params.set(key, value)
  )
  for (const [key, value] of Object.entries(extra ?? {})) params.set(key, value)
  return (
    <a
      href={`/api/admin/analytics/export?${params}`}
      className={'admin-btn-ghost'}
      download
    >
      <ArrowDownTrayIcon className={'size-4'} aria-hidden={'true'} />
      {label}
    </a>
  )
}
