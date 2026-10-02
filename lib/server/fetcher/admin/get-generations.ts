/**
 * 관리자 기수 목록 조회.
 *
 * 캐시하지 않는 관리자 조회다(권한·기수 범위에 따라 결과가 달라 공유 캐시를 쓰지 않는다).
 * 권한 확인은 호출부(레이아웃 가드, 서비스)가 먼저 한다.
 */
import 'server-only'
import { db } from '@/db'
import { generations } from '@/db/schema/generations'
import { desc } from 'drizzle-orm'

/** 모든 기수를 최신(ID 큰) 순으로 읽는다. */
export async function getGenerations() {
  return db.select().from(generations).orderBy(desc(generations.id))
}

/** 관리자 기수 목록의 한 행. */
export type AdminGenerationListItem = Awaited<
  ReturnType<typeof getGenerations>
>[number]
