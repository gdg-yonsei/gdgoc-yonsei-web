// 권한·기수별 조회는 공유 캐시하지 않는다. 호출부가 권한을 먼저 확인해야 한다.
import 'server-only'

import { db } from '@/db'
import { users } from '@/db/schema/users'
import { asc, ne } from 'drizzle-orm'

// 선택기가 기수·파트를 조합해 거르도록 대표 소속 대신 승인된 멤버의 모든 소속을 읽는다.
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
