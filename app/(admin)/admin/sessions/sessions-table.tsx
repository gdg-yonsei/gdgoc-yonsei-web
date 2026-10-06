import SessionsTableClient from '@/app/(admin)/admin/sessions/sessions-table-client'
import type { AdminGenerationScope } from '@/lib/server/admin-generation-scope'
import { getSessions } from '@/lib/server/fetcher/admin/get-sessions'

export default async function SessionsTable({
  scope,
}: {
  scope: AdminGenerationScope | null
}) {
  const sessionsData = await getSessions(scope)

  return <SessionsTableClient sessionsData={sessionsData} scope={scope} />
}
