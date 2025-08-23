import { sessions } from '@/db/schema/sessions'
import 'server-only'
import db from '@/db'
import { desc } from 'drizzle-orm'
import { generations } from '@/db/schema/generations'
import { cacheTag } from 'next/dist/server/use-cache/cache-tag'

export const preload = () => {
  void getSessions()
}

export async function getSessions() {
  'use cache'
  console.log(new Date(), 'Fetch Sessions Data')
  cacheTag('generations', 'sessions')

  return db.query.generations.findMany({
    with: {
      parts: {
        with: {
          sessions: {
            orderBy: desc(sessions.startAt),
          },
        },
      },
    },
    orderBy: desc(generations.id),
  })
}
