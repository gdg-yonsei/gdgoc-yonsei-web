import 'server-only'
import db from '@/db'
import { unstable_cache } from 'next/cache'
import { asc, desc } from 'drizzle-orm'
import { usersToParts } from '@/db/schema/users-to-parts'
import { parts } from '@/db/schema/parts'

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
