/** 탐색 탭. 고를 수 있는 차원·지표 목록은 서버가 넘긴다(서버 전용 모듈을 클라이언트가 import하지 않게). */
import type { Metadata } from 'next'
import { forbidden } from 'next/navigation'
import ExploreView from '@/app/(admin)/admin/analytics/_components/explore-view'
import { ReportError } from '@/app/(admin)/admin/analytics/_components/report-states'
import { readAnalyticsFilter } from '@/app/(admin)/admin/analytics/_lib/read-filter'
import { SESSION_METRIC_KEYS } from '@/lib/analytics/metrics'
import { SESSION_DIMENSIONS } from '@/lib/server/analytics/queries/sessions'
import {
  getAnalyticsTable,
  parseExploreInput,
} from '@/lib/server/services/admin/analytics'
import { getWebActor } from '@/lib/server/services/admin/web-actor'

export const metadata: Metadata = { title: 'Explore' }

export default async function ExplorePage({
  searchParams,
}: PageProps<'/admin/analytics/explore'>) {
  const [filter, actor, params] = await Promise.all([
    readAnalyticsFilter(searchParams),
    getWebActor(),
    searchParams,
  ])
  if (!actor) forbidden()
  const explore = parseExploreInput(params)
  const result = await getAnalyticsTable(actor, 'explore', filter, explore)
  if (!result.ok) return <ReportError message={result.message} />
  return (
    <ExploreView
      table={result.data}
      explore={explore}
      filter={filter}
      dimensionOptions={SESSION_DIMENSIONS}
      metricOptions={SESSION_METRIC_KEYS}
    />
  )
}
