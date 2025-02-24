import db from '@/db'
import { unstable_cache } from 'next/cache'
import { desc } from 'drizzle-orm'
import { usersToParts } from '@/db/schema/users-to-parts'

export const preload = () => {
  void getMembers()
}

export const getMembers = unstable_cache(
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
          limit: 1,
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
    }),
  [],
  {
    tags: ['members'],
  }
)
