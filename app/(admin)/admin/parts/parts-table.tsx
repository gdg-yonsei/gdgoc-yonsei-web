import PartsTableClient from '@/app/(admin)/admin/parts/parts-table-client'
import type { AdminGenerationScope } from '@/lib/server/admin-generation-scope'
import { getParts } from '@/lib/server/fetcher/admin/get-parts'

/**
 * 목록 데이터를 서버에서 읽어 클라이언트 표에 넘기는 래퍼.
 * 페이지가 Suspense로 감싸 데이터가 오는 동안 스켈레톤을 보여 준다.
 */
export default async function PartsTable({
  scope,
}: {
  scope: AdminGenerationScope | null
}) {
  const partsData = await getParts(scope)

  return <PartsTableClient partsData={partsData} scope={scope} />
}
