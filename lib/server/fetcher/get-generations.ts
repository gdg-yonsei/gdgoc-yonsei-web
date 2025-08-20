import 'server-only'
import db from '@/db'
import { asc } from 'drizzle-orm'
import { generations } from '@/db/schema/generations'
import { parts } from '@/db/schema/parts'
import { dbCache } from '@/lib/server/fetcher/db-cache'

export const preload = () => {
  void getGenerations()
}

export const getGenerations = dbCache(
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
          orderBy: asc(parts.id),
        },
      },
    }),
  [],
  { tags: ['generations', 'parts', 'users'] }
)
