import 'server-only'
import { unstable_cache } from 'next/cache'
import db from '@/db'
import { eq } from 'drizzle-orm'
import { projects } from '@/db/schema/projects'

export const preload = (sessionId: string) => {
  void getSession(sessionId)
}

/**
 * Get Part Data
 * @param sessionId - part id
 */
export const getSession = unstable_cache(
  async (sessionId: string) => {
    console.log(new Date(), 'Fetch Session Data', sessionId)
    return db.query.sessions.findFirst({
      where: eq(projects.id, sessionId),
    })
  },
  [],
  {
    tags: ['sessions'],
  }
)
