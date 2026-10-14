/** 분석 영역의 권한 경계(get analyticsPage)와 공통 머리: 제목, 필터 바, 탭. 필터 바·탭은 searchParams를 읽어 Suspense가 필요하다. */
import { Suspense, type ReactNode } from 'react'
import FilterBar from '@/app/(admin)/admin/analytics/_components/filter-bar'
import AnalyticsTabs from '@/app/(admin)/admin/analytics/_components/analytics-tabs'
import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminPageHeader from '@/app/components/admin/page-header'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'
import { requirePermission } from '@/lib/server/permission/require-permission'

export default async function AnalyticsLayout({
  children,
}: {
  children: ReactNode
}) {
  await requirePermission('get', 'analyticsPage')
  const t = getAdminMessages(await getAdminLocale())

  return (
    <AdminDefaultLayout>
      <AdminPageHeader
        title={t.analytics}
        description={t.analyticsDescription}
      />
      <Suspense fallback={null}>
        <FilterBar />
        <AnalyticsTabs />
      </Suspense>
      {children}
    </AdminDefaultLayout>
  )
}
