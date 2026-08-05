import { getSessions } from '@/lib/server/fetcher/admin/get-sessions'
import { type AdminGenerationScope } from '@/lib/server/admin-generation-scope'
import { type AdminMessages } from '@/lib/admin-i18n'
import { type Locale } from '@/i18n-config'
import SessionsTableClient from './sessions-table-client'

export default async function SessionsTable({
  scope,
  locale,
  t,
}: {
  scope: AdminGenerationScope | null
  locale: Locale
  t: AdminMessages
}) {
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
