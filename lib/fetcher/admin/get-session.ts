import 'server-only'
import { unstable_cache } from 'next/cache'
import db from '@/db'
import { eq } from 'drizzle-orm'
import { projects } from '@/db/schema/projects'
import { users } from '@/db/schema/users'

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
    const sessionData = await db.query.sessions.findFirst({
      where: eq(projects.id, sessionId),
    })
    if (!sessionData) {
      return null
    }
    const authorData = await db.query.users.findFirst({
      where: eq(users.id, sessionData.authorId!),
    })
    return { ...sessionData, author: authorData }
  },
  [],
  {
    tags: ['sessions'],
  }
)
