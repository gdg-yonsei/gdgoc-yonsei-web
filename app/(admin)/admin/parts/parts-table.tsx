import { getParts } from '@/lib/server/fetcher/admin/get-parts'
import PartsTableClient from '@/app/(admin)/admin/parts/parts-table-client'
import { type AdminGenerationScope } from '@/lib/server/admin-generation-scope'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'

/**
 * 파트 정보 표시 테이블
 * @constructor
 */
export default async function PartsTable({
  scope,
}: {
  scope: AdminGenerationScope | null
}) {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  // 파트 데이터 가져오기
  const partsData = await getParts(scope)

  return (
    <PartsTableClient
      partsData={partsData}
      scope={scope}
      locale={locale}
      t={t}
    />
  )
}
