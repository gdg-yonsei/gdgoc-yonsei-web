/** 사용자 탭. */
import type { Metadata } from 'next'
import { forbidden } from 'next/navigation'
import AudienceView from '@/app/(admin)/admin/analytics/_components/audience-view'
import { ReportError } from '@/app/(admin)/admin/analytics/_components/report-states'
import { readAnalyticsFilter } from '@/app/(admin)/admin/analytics/_lib/read-filter'
import { getAnalyticsAudience } from '@/lib/server/services/admin/analytics'
import { getWebActor } from '@/lib/server/services/admin/web-actor'

export const metadata: Metadata = { title: 'Audience' }

export default async function AudiencePage({
  searchParams,
}: PageProps<'/admin/analytics/audience'>) {
  const [filter, actor] = await Promise.all([
    readAnalyticsFilter(searchParams),
    getWebActor(),
  ])
  if (!actor) forbidden()
  const result = await getAnalyticsAudience(actor, filter)
  return result.ok ? (
    <AudienceView data={result.data} filter={filter} />
  ) : (
    <ReportError message={result.message} />
  )
}
