import { sessions } from '@/db/schema/sessions'

import 'server-only'
import { unstable_cache } from 'next/cache'
import db from '@/db'
import { desc } from 'drizzle-orm'
import { generations } from '@/db/schema/generations'

export const preload = () => {
  void getSessions()
}

/**
 * Get Sessions Data
 */
export const getSessions = unstable_cache(
  async () => {
    console.log(new Date(), 'Fetch Sessions Data')
    return db.query.generations.findMany({
      with: {
        sessions: {
          orderBy: desc(sessions.eventDate),
        },
      },
      orderBy: desc(generations.id),
    })
  },
  [],
  {
    tags: ['sessions', 'generations'],
  }
)
