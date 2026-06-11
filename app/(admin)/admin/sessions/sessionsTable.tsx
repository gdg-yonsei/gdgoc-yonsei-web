import {
  getSessions,
} from '@/lib/server/fetcher/admin/get-sessions'
import { type AdminGenerationScope } from '@/lib/server/admin-generation-scope'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'
import SessionsTableClient from './sessions-table-client'

export default async function SessionsTable({
  scope,
}: {
  scope: AdminGenerationScope | null
}) {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  const sessionsData = await getSessions(scope)

  return (
    <SessionsTableClient
      sessionsData={sessionsData}
      scope={scope}
      locale={locale}
      t={t}
    />
  )
}

