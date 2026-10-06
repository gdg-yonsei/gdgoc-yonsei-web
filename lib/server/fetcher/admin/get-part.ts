// 권한·기수별 조회는 공유 캐시하지 않는다. 호출부가 권한을 먼저 확인해야 한다.
import 'server-only'
import { cache } from 'react'
import { db } from '@/db'
import { desc, eq } from 'drizzle-orm'
import { parts } from '@/db/schema/parts'

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
          user: true,
        },
      },
    },
    orderBy: desc(parts.createdAt),
  })
})
