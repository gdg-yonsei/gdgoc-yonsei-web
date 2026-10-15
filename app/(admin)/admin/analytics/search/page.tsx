/** 검색 탭. Search Console 개요와 개선 기회를 함께 읽는다. 한쪽이 실패해도 다른 쪽은 보인다. */
import type { Metadata } from 'next'
import { forbidden } from 'next/navigation'
import { ReportError } from '@/app/(admin)/admin/analytics/_components/report-states'
import SearchView from '@/app/(admin)/admin/analytics/_components/search-view'
import { readAnalyticsFilter } from '@/app/(admin)/admin/analytics/_lib/read-filter'
import {
  getSearchConsoleOverview,
  getSeoOpportunities,
} from '@/lib/server/services/admin/search-console'
import { getWebActor } from '@/lib/server/services/admin/web-actor'

export const metadata: Metadata = { title: 'Search' }

export default async function SearchPage({
  searchParams,
}: PageProps<'/admin/analytics/search'>) {
  const [filter, actor] = await Promise.all([
    readAnalyticsFilter(searchParams),
    getWebActor(),
  ])
  if (!actor) forbidden()
  const [overview, opportunities] = await Promise.all([
    getSearchConsoleOverview(actor, filter),
    getSeoOpportunities(actor, filter),
  ])
  if (!overview.ok) return <ReportError message={overview.message} />
  return (
    <div className={'flex flex-col gap-4'}>
      {!opportunities.ok && <ReportError message={opportunities.message} />}
      <SearchView
        overview={overview.data}
        opportunities={
          opportunities.ok ? opportunities.data : { configured: false }
        }
      />
    </div>
  )
}
