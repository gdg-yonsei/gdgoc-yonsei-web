/**
 * 관리자 파트 상세 조회(기수, 구성원 포함).
 *
 * 캐시하지 않는 관리자 조회다(권한·기수 범위에 따라 결과가 달라 공유 캐시를 쓰지 않는다).
 * 권한 확인은 호출부(레이아웃 가드, 서비스)가 먼저 한다.
 */
import 'server-only'
import { cache } from 'react'
import { db } from '@/db'
import { desc, eq } from 'drizzle-orm'
import { parts } from '@/db/schema/parts'

/** 파트 하나를 기수·구성원과 함께 읽는다. */
export const getPart = cache(async (partId: number) => {
  // 숫자가 아닌 라우트 파라미터를 그대로 넘기면 DB 오류(500)가 나므로, 대신 404가 되도록 undefined를 돌려준다.
  if (!Number.isInteger(partId)) {
    return undefined
  }

  return db.query.parts.findFirst({
    where: eq(parts.id, partId),
    with: {
      generation: true,
      usersToParts: {
        with: {
          user: true, // 구성원마다 사용자 정보 전체를 함께 읽는다
        },
      },
    },
    orderBy: desc(parts.createdAt),
  })
})
