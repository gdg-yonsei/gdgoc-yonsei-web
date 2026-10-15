/** 참여 탭. */
import type { Metadata } from 'next'
import { forbidden } from 'next/navigation'
import EngagementView from '@/app/(admin)/admin/analytics/_components/engagement-view'
import { ReportError } from '@/app/(admin)/admin/analytics/_components/report-states'
import { readAnalyticsFilter } from '@/app/(admin)/admin/analytics/_lib/read-filter'
import { getAnalyticsEngagement } from '@/lib/server/services/admin/analytics'
import { getWebActor } from '@/lib/server/services/admin/web-actor'

export const metadata: Metadata = { title: 'Engagement' }

export default async function EngagementPage({
  searchParams,
}: PageProps<'/admin/analytics/engagement'>) {
  const [filter, actor] = await Promise.all([
    readAnalyticsFilter(searchParams),
    getWebActor(),
  ])
  if (!actor) forbidden()
  const result = await getAnalyticsEngagement(actor, filter)
  return result.ok ? (
    <EngagementView data={result.data} filter={filter} />
  ) : (
    <ReportError message={result.message} />
  )
}
