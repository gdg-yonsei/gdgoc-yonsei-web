import GenerationsTableClient from '@/app/(admin)/admin/generations/generations-table-client'
import { getGenerations } from '@/lib/server/fetcher/admin/get-generations'

/**
 * 기수 목록을 서버에서 읽어 클라이언트 표에 넘기는 래퍼.
 * 페이지가 Suspense로 감싸 데이터가 오는 동안 스켈레톤을 보여 준다.
 */
export default async function GenerationsTable() {
  const generationsData = await getGenerations()

  return <GenerationsTableClient generationsData={generationsData} />
}
