/**
 * 멤버 목록 서버 래퍼.
 */
import MembersTableClient from '@/app/(admin)/admin/members/members-table-client'
import type { AdminGenerationScope } from '@/lib/server/admin-generation-scope'
import { getMembers } from '@/lib/server/fetcher/admin/get-members'

/**
 * 목록 데이터를 서버에서 읽어 클라이언트 표에 넘기는 래퍼.
 * 페이지가 Suspense로 감싸 데이터가 오는 동안 스켈레톤을 보여 준다.
 */
export default async function MembersTable({
  scope,
}: {
  scope: AdminGenerationScope | null
}) {
  const membersData = await getMembers(scope)

  return <MembersTableClient membersData={membersData} scope={scope} />
}
