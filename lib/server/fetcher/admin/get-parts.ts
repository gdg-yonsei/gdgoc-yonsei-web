import 'server-only'
import db from '@/db'
import { asc, desc } from 'drizzle-orm'
import { generations } from '@/db/schema/generations'
import { parts } from '@/db/schema/parts'
import cacheTagT from '@/lib/server/cacheTagT'

export const preload = () => {
  void getParts()
}

export async function getParts() {
  'use cache'
  cacheTagT('parts', 'members')

  console.log(new Date(), 'Fetch Parts Data')
  return db.query.generations.findMany({
    with: {
      parts: {
        with: {
          usersToParts: {
            with: {
              user: true, // Include full user object for each member
            },
          },
        },
      },
    },
    orderBy: [desc(generations.id), asc(parts.createdAt)],
  })
}
