import { unstable_cache } from 'next/cache'
import db from '@/db'
import { asc } from 'drizzle-orm'
import { generations } from '@/db/schema/generations'

export const preload = () => {
  void getGenerations()
}

export const getGenerations = unstable_cache(
  async () =>
    db.query.generations.findMany({
      columns: {
        id: false,
      },
      orderBy: asc(generations.id),
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
    }),
  [],
  { tags: ['generations', 'parts', 'members'] }
)
