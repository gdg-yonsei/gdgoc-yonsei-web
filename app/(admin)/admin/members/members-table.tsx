import { getMembers } from '@/lib/server/fetcher/admin/get-members'
import { type AdminGenerationScope } from '@/lib/server/admin-generation-scope'
import { type AdminMessages } from '@/lib/admin-i18n'
import { type Locale } from '@/i18n-config'
import MembersTableClient from './members-table-client'

export default async function MembersTable({
  scope,
  locale,
  t,
}: {
  scope: AdminGenerationScope | null
  locale: Locale
  t: AdminMessages
}) {
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
