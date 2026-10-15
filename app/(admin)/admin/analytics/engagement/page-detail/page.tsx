/** 페이지 상세. 경로는 `page` 쿼리로 받는다(경로에 슬래시가 있어 세그먼트로 넣지 않는다). */
import type { Metadata } from 'next'
import { forbidden, notFound } from 'next/navigation'
import PageDetailView from '@/app/(admin)/admin/analytics/_components/page-detail-view'
import { ReportError } from '@/app/(admin)/admin/analytics/_components/report-states'
import { readAnalyticsFilter } from '@/app/(admin)/admin/analytics/_lib/read-filter'
import { getAnalyticsPageDetail } from '@/lib/server/services/admin/analytics'
import { getWebActor } from '@/lib/server/services/admin/web-actor'

export const metadata: Metadata = { title: 'Page detail' }

export default async function PageDetailPage({
  searchParams,
}: PageProps<'/admin/analytics/engagement/page-detail'>) {
  const [filter, actor, params] = await Promise.all([
    readAnalyticsFilter(searchParams),
    getWebActor(),
    searchParams,
  ])
  if (!actor) forbidden()
  const path =
    typeof params.page === 'string' && params.page.startsWith('/')
      ? params.page.slice(0, 512)
      : null
  if (!path) notFound()
  const result = await getAnalyticsPageDetail(actor, filter, path)
  return result.ok ? (
    <PageDetailView data={result.data} path={path} />
  ) : (
    <ReportError message={result.message} />
  )
}
