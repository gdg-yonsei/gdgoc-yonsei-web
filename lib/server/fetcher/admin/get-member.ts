/**
 * 관리자 멤버 상세 조회.
 *
 * 캐시하지 않는 관리자 조회다(권한·기수 범위에 따라 결과가 달라 공유 캐시를 쓰지 않는다).
 * 권한 확인은 호출부(레이아웃 가드, 서비스)가 먼저 한다.
 */
import 'server-only'
import { cache } from 'react'
import { db } from '@/db'
import { users } from '@/db/schema/users'
import { desc, eq, sql } from 'drizzle-orm'
import { usersToParts } from '@/db/schema/users-to-parts'
import { parts } from '@/db/schema/parts'
import { generations } from '@/db/schema/generations'

/**
 * 멤버 한 명의 프로필과 대표 소속(파트·기수)을 읽는다.
 * 여러 기수에 속하면 `generationId`(현재 선택한 기수)의 소속을, 없으면 최신 기수 소속을 고른다.
 *
 * `users.id`는 text 컬럼이고 Better Auth가 UUID가 아닌 임의 문자열 ID를 발급하므로
 * UUID 형식 검증을 하지 않는다(text 비교라 형식이 틀려도 DB 오류가 나지 않는다).
 */
export const getMember = cache(
  async (userId: string, generationId?: number | null) => {
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        firstName: users.firstName,
        firstNameKo: users.firstNameKo,
        lastName: users.lastName,
        lastNameKo: users.lastNameKo,
        role: users.role,
        image: users.image,
        part: parts.name,
        email: users.email,
        githubId: users.githubId,
        instagramId: users.instagramId,
        linkedInId: users.linkedInId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        isForeigner: users.isForeigner,
        generationId: generations.id,
        generation: generations.name,
        major: users.major,
        studentId: users.studentId,
        telephone: users.telephone,
        sessionNotiEmail: users.sessionNotiEmail,
      })
      .from(users)
      .where(eq(users.id, userId))
      .leftJoin(usersToParts, eq(usersToParts.userId, users.id))
      .leftJoin(parts, eq(parts.id, usersToParts.partId))
      .leftJoin(generations, eq(generations.id, parts.generationsId))
      .orderBy(
        generationId
          ? desc(
              sql<number>`CASE WHEN ${generations.id} = ${generationId} THEN 1 ELSE 0 END`
            )
          : desc(generations.id),
        desc(generations.id),
        desc(parts.id),
        desc(users.updatedAt)
      )
      .limit(1)

    return result[0]
  }
)
