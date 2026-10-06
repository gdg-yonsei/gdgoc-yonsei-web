// 승인 화면 레이아웃이 membersRole 수정 권한을 먼저 확인해야 한다. 조회는 공유 캐시하지 않는다.
import 'server-only'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema/users'

// 승인 화면에는 공개 정보만 필요해 전화번호·학번 등 연락처는 읽지 않는다.
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
