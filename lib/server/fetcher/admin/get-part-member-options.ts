/**
 * 파트 구성원 선택기용 멤버 목록 조회.
 *
 * 캐시하지 않는 관리자 조회다(권한·기수 범위에 따라 결과가 달라 공유 캐시를 쓰지 않는다).
 * 권한 확인은 호출부(레이아웃 가드, 서비스)가 먼저 한다.
 */
import 'server-only'

import { db } from '@/db'
import { users } from '@/db/schema/users'
import { asc, ne } from 'drizzle-orm'

/**
 * 승인된 멤버 전체를 모든 소속(파트·기수)과 함께 읽는다.
 * 선택기가 기수·파트를 조합해 거를 수 있도록 대표 소속 하나가 아니라 소속 전체를 담는다.
 */
export async function getPartMemberOptions() {
  return db.query.users.findMany({
    where: ne(users.role, 'UNVERIFIED'),
    orderBy: [asc(users.name), asc(users.id)],
    columns: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      firstNameKo: true,
      lastNameKo: true,
      isForeigner: true,
    },
    with: {
      usersToParts: {
        columns: {},
        with: {
          part: {
            columns: { id: true, name: true, generationsId: true },
            with: { generation: { columns: { id: true, name: true } } },
          },
        },
      },
    },
  })
}
