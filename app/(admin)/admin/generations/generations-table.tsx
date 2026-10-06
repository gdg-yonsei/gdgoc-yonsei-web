import GenerationsTableClient from '@/app/(admin)/admin/generations/generations-table-client'
import { getGenerations } from '@/lib/server/fetcher/admin/get-generations'

export default async function GenerationsTable() {
  const generationsData = await getGenerations()

  return <GenerationsTableClient generationsData={generationsData} />
}
