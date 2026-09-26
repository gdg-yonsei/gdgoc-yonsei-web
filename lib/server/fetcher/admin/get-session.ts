import 'server-only'
import { cache } from 'react'
import db from '@/db'
import { eq } from 'drizzle-orm'
import { sessions } from '@/db/schema/sessions'
import { isUuid } from '@/lib/server/queries/public/uuid'

/**
 * Preloads the data for a specific session into the cache.
 *
 * @param sessionId - The ID of the session to preload.
 */

// React cache() 로 요청 단위 메모이즈 — generateMetadata 와 페이지 본문이
// 같은 쿼리를 두 번 날리지 않는다.
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
