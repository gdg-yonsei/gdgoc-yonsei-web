/**
 * 가입 승인 대기 멤버 조회(가입 승인 화면).
 *
 * 캐시하지 않는 관리자 조회다. 권한 확인(`membersRole` 수정)은 승인 화면 레이아웃이 먼저 한다.
 */
import 'server-only'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema/users'

/**
 * 역할이 `UNVERIFIED`인 사용자를 가입 순으로 읽는다. 승인 판단에 필요한 공개 정보만 고른다
 * (전화번호·학번 같은 연락처는 이 화면에 필요 없다).
 */
export async function getPendingMembers() {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      githubId: users.githubId,
      instagramId: users.instagramId,
      linkedInId: users.linkedInId,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, 'UNVERIFIED'))
    .orderBy(asc(users.createdAt))
}
