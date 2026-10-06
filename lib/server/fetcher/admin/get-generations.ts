// 권한·기수별 조회는 공유 캐시하지 않는다. 호출부가 권한을 먼저 확인해야 한다.
import 'server-only'
import { db } from '@/db'
import { generations } from '@/db/schema/generations'
import { desc } from 'drizzle-orm'

export async function getGenerations() {
  return db.select().from(generations).orderBy(desc(generations.id))
}

export type AdminGenerationListItem = Awaited<
  ReturnType<typeof getGenerations>
>[number]
