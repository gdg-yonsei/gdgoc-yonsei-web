// 권한·기수별 조회는 공유 캐시하지 않는다. 호출부가 권한을 먼저 확인해야 한다.
import 'server-only'
import { cache } from 'react'
import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { sessions } from '@/db/schema/sessions'
import { isUuid } from '@/lib/server/queries/public/uuid'

// 잘못된 UUID는 undefined로 처리한다. metadata·본문 중복 조회는 요청 내 React cache로 합친다.
export const getSession = cache(async (sessionId: string) => {
  if (!isUuid(sessionId)) {
    return undefined
  }

  return db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    with: {
      part: {
        with: {
          generation: true,
        },
      },
      userToSession: {
        with: {
          user: true,
        },
      },
      author: true,
    },
  })
})
