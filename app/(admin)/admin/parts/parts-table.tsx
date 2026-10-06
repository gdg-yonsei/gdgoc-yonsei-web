import PartsTableClient from '@/app/(admin)/admin/parts/parts-table-client'
import type { AdminGenerationScope } from '@/lib/server/admin-generation-scope'
import { getParts } from '@/lib/server/fetcher/admin/get-parts'

export default async function PartsTable({
  scope,
}: {
  scope: AdminGenerationScope | null
}) {
  const partsData = await getParts(scope)

  return <PartsTableClient partsData={partsData} scope={scope} />
}
