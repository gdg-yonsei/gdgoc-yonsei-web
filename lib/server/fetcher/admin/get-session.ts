import 'server-only'
import db from '@/db'
import { eq } from 'drizzle-orm'
import { sessions } from '@/db/schema/sessions'

/**
 * Preloads the data for a specific session into the cache.
 *
 * @param sessionId - The ID of the session to preload.
 */

export async function getSession(sessionId: string) {
  return db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    with: {
      part: {
        with: {
          generation: true,
        },
      },
      userToSession: {
        with: {
          user: true,
        },
      },
      author: true,
    },
  })
}
