import 'server-only'

import db from '@/db'
import { users } from '@/db/schema/users'
import { asc, ne } from 'drizzle-orm'

// Preserve every membership: a representative part cannot support combined filters.
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
