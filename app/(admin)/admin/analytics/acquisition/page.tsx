/** 유입 탭. */
import type { Metadata } from 'next'
import { forbidden } from 'next/navigation'
import AcquisitionView from '@/app/(admin)/admin/analytics/_components/acquisition-view'
import { ReportError } from '@/app/(admin)/admin/analytics/_components/report-states'
import { readAnalyticsFilter } from '@/app/(admin)/admin/analytics/_lib/read-filter'
import { getAnalyticsAcquisition } from '@/lib/server/services/admin/analytics'
import { getWebActor } from '@/lib/server/services/admin/web-actor'

export const metadata: Metadata = { title: 'Acquisition' }

export default async function AcquisitionPage({
  searchParams,
}: PageProps<'/admin/analytics/acquisition'>) {
  const [filter, actor] = await Promise.all([
    readAnalyticsFilter(searchParams),
    getWebActor(),
  ])
  if (!actor) forbidden()
  const result = await getAnalyticsAcquisition(actor, filter)
  return result.ok ? (
    <AcquisitionView data={result.data} filter={filter} />
  ) : (
    <ReportError message={result.message} />
  )
}
