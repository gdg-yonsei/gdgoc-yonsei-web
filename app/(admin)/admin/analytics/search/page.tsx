/** 검색 탭. Search Console 연동은 계획 C가 이 화면을 채운다. 그 전까지 탭 링크가 404가 되지 않게 안내만 보여 준다. */
import type { Metadata } from 'next'
import AdminEmptyState from '@/app/components/admin/empty-state'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'

export const metadata: Metadata = { title: 'Search' }

export default async function SearchPage() {
  const t = getAdminMessages(await getAdminLocale())
  return (
    <AdminEmptyState
      title={t.analyticsTabSearch}
      description={t.analyticsSearchConsoleSoon}
    />
  )
}
