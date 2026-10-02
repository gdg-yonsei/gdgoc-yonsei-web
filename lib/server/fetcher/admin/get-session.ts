/**
 * 관리자 세션 상세 조회(파트·기수, 참가자, 작성자 포함).
 *
 * 캐시하지 않는 관리자 조회다(권한·기수 범위에 따라 결과가 달라 공유 캐시를 쓰지 않는다).
 * 권한 확인은 호출부(레이아웃 가드, 서비스)가 먼저 한다.
 */
import 'server-only'
import { cache } from 'react'
import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { sessions } from '@/db/schema/sessions'
import { isUuid } from '@/lib/server/queries/public/uuid'

/**
 * 세션 하나를 읽는다. UUID 형식이 아니면 `undefined`(404로 이어진다).
 * React `cache()`로 요청 단위 메모이즈해 `generateMetadata`와 페이지 본문이 같은
 * 쿼리를 두 번 실행하지 않게 한다.
 */
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
