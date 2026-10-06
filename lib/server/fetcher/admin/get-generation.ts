// 권한·기수별 조회는 공유 캐시하지 않는다. 호출부가 권한을 먼저 확인해야 한다.
import 'server-only'
import { cache } from 'react'
import { db } from '@/db'
import { generations } from '@/db/schema/generations'
import { eq } from 'drizzle-orm'

/** 기수 하나를 파트·구성원과 함께 읽는다. ID가 정수가 아니면 `undefined`(404로 이어진다). */
export const getGeneration = cache(async (generationId: number) => {
  if (!Number.isInteger(generationId)) {
    return undefined
  }

  return db.query.generations.findFirst({
    where: eq(generations.id, generationId),
    with: {
      parts: {
        with: {
          usersToParts: {
            with: {
              user: true,
            },
          },
        },
      },
    },
  })
})
