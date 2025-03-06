import { sessions } from '@/db/schema/sessions'

import 'server-only'
import { unstable_cache } from 'next/cache'
import db from '@/db'
import { desc } from 'drizzle-orm'

export const preload = () => {
  void getSessions()
}

/**
 * Get Sessions Data
 */
export const getSessions = unstable_cache(
  async () => {
    console.log(new Date(), 'Fetch Sessions Data')
    return db.query.sessions.findMany({
      orderBy: [desc(sessions.generationId), desc(sessions.updatedAt)],
    })
  },
  [],
  {
    tags: ['sessions'],
  }
)
