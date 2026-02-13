import 'server-only'
import db from '@/db'
import { asc } from 'drizzle-orm'
import { generations } from '@/db/schema/generations'
import { parts } from '@/db/schema/parts'
import applyCacheTags from '@/lib/server/cacheTagT'

export const preloadGenerations = () => {
  void getGenerations()
}

export async function getGenerations() {
  'use cache'
  applyCacheTags('generations', 'parts', 'members')
  return db.query.generations.findMany({
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
  })
}
