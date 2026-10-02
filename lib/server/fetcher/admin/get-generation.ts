/**
 * 관리자 기수 상세 조회(파트와 파트 구성원 포함).
 *
 * 캐시하지 않는 관리자 조회다(권한·기수 범위에 따라 결과가 달라 공유 캐시를 쓰지 않는다).
 * 권한 확인은 호출부(레이아웃 가드, 서비스)가 먼저 한다.
 */
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
