/** 분석 개요 탭. 개요 묶음과 실시간 첫 값을 서버에서 읽고, 실시간은 이후 클라이언트가 갱신한다. */
import type { Metadata } from 'next'
import { forbidden } from 'next/navigation'
import OverviewView from '@/app/(admin)/admin/analytics/_components/overview-view'
import RealtimeCard from '@/app/(admin)/admin/analytics/_components/realtime-card'
import { ReportError } from '@/app/(admin)/admin/analytics/_components/report-states'
import { readAnalyticsFilter } from '@/app/(admin)/admin/analytics/_lib/read-filter'
import {
  getAnalyticsOverview,
  getAnalyticsRealtime,
} from '@/lib/server/services/admin/analytics'
import { getWebActor } from '@/lib/server/services/admin/web-actor'

export const metadata: Metadata = { title: 'Analytics' }

export default async function AnalyticsOverviewPage({
  searchParams,
}: PageProps<'/admin/analytics'>) {
  const [filter, actor] = await Promise.all([
    readAnalyticsFilter(searchParams),
    getWebActor(),
  ])
  if (!actor) forbidden()

  const [overview, realtime] = await Promise.all([
    getAnalyticsOverview(actor, filter),
    getAnalyticsRealtime(actor, filter.includeInternal),
  ])

  return (
    <div className={'grid items-start gap-4 xl:grid-cols-[1fr_320px]'}>
      <div className={'min-w-0'}>
        {overview.ok ? (
          <OverviewView data={overview.data} filter={filter} />
        ) : (
          <ReportError message={overview.message} />
        )}
      </div>
      {realtime.ok && (
        <RealtimeCard
          initial={realtime.data}
          includeInternal={filter.includeInternal}
        />
      )}
    </div>
  )
}
