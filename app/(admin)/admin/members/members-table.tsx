import MembersTableClient from '@/app/(admin)/admin/members/members-table-client'
import type { AdminGenerationScope } from '@/lib/server/admin-generation-scope'
import { getMembers } from '@/lib/server/fetcher/admin/get-members'

export default async function MembersTable({
  scope,
}: {
  scope: AdminGenerationScope | null
}) {
  const membersData = await getMembers(scope)

  return <MembersTableClient membersData={membersData} scope={scope} />
}
