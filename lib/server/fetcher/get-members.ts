import 'server-only'
import db from '@/db'
import { asc, desc } from 'drizzle-orm'
import { usersToParts } from '@/db/schema/users-to-parts'
import { parts } from '@/db/schema/parts'
import { fetcher } from '@/lib/server/fetcher/fetcher'

export const preloadMembers = () => {
  void getMembers()
}

export const getMembers = fetcher(
  async () =>
    db.query.users.findMany({
      with: {
        usersToParts: {
          with: {
            part: {
              columns: {
                name: true,
              },
              with: {
                generation: {
                  columns: {
                    id: false,
                  },
                },
              },
            },
          },
          columns: {
            partId: false,
            userId: false,
          },
          orderBy: desc(usersToParts.partId),
        },
      },
      columns: {
        createdAt: false,
        emailVerified: false,
        id: false,
        registeredAt: false,
        studentId: false,
        telephone: false,
        updatedAt: false,
      },
      orderBy: asc(parts.id),
    }),
  [],
  {
    tags: ['members'],
  }
)
