/** 성능 탭. */
import type { Metadata } from 'next'
import { forbidden } from 'next/navigation'
import PerformanceView from '@/app/(admin)/admin/analytics/_components/performance-view'
import { ReportError } from '@/app/(admin)/admin/analytics/_components/report-states'
import { readAnalyticsFilter } from '@/app/(admin)/admin/analytics/_lib/read-filter'
import { getAnalyticsWebVitals } from '@/lib/server/services/admin/analytics'
import { getWebActor } from '@/lib/server/services/admin/web-actor'

export const metadata: Metadata = { title: 'Performance' }

export default async function PerformancePage({
  searchParams,
}: PageProps<'/admin/analytics/performance'>) {
  const [filter, actor] = await Promise.all([
    readAnalyticsFilter(searchParams),
    getWebActor(),
  ])
  if (!actor) forbidden()
  const result = await getAnalyticsWebVitals(actor, filter)
  return result.ok ? (
    <PerformanceView data={result.data} filter={filter} />
  ) : (
    <ReportError message={result.message} />
  )
}
