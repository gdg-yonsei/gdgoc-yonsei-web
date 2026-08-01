import { getGenerations } from '@/lib/server/fetcher/admin/get-generations'
import GenerationsTableClient, {
  type AdminGenerationListItem,
} from '@/app/(admin)/admin/generations/generations-table-client'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'

/**
 * Generations 를 보여주는 Table 컴포넌트
 * @constructor
 */
export default async function GenerationsTable() {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  // generations 데이터 가져오기
  const generationsData = await getGenerations()

  return (
    <GenerationsTableClient
      generationsData={generationsData as AdminGenerationListItem[]}
      locale={locale}
      t={t}
    />
  )
}
