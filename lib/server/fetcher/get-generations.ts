import 'server-only'
import db from '@/db'
import { asc } from 'drizzle-orm'
import { generations } from '@/db/schema/generations'
import { parts } from '@/db/schema/parts'
import cacheTagT from '@/lib/server/cacheTagT'

export const preload = () => {
  void getGenerations()
}

export async function getGenerations() {
  'use cache'
  cacheTagT('generations', 'parts', 'members')
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
