import {
  getMembers,
} from '@/lib/server/fetcher/admin/get-members'
import { type AdminGenerationScope } from '@/lib/server/admin-generation-scope'
import {
  getAdminLocale,
  getAdminMessages,
} from '@/lib/admin-i18n/server'
import MembersTableClient from './members-table-client'

export default async function MembersTable({
  scope,
}: {
  scope: AdminGenerationScope | null
}) {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  // 멤버 정보 가져오기
  const membersData = await getMembers(scope)

  return (
    <MembersTableClient
      membersData={membersData}
      scope={scope}
      locale={locale}
      t={t}
    />
  )
}

