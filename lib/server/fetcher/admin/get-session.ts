import 'server-only'
import db from '@/db'
import { eq } from 'drizzle-orm'
import { sessions } from '@/db/schema/sessions'
import { users } from '@/db/schema/users'
import cacheTagT from '@/lib/server/cacheTagT'

/**
 * Preloads the data for a specific session into the cache.
 *
 * @param sessionId - The ID of the session to preload.
 */
export const preload = (sessionId: string) => {
  void getSession(sessionId)
}

export async function getSession(sessionId: string) {
  'use cache'
  cacheTagT('sessions')

  console.log(new Date(), 'Fetch Session Data', sessionId)

  // Fetch the main session data, including the generation it belongs to.
  const sessionData = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    with: {
      part: true,
      userToSession: {
        with: {
          user: true,
        },
      },
    },
  })

  // If the session doesn't exist, return null.
  if (!sessionData) {
    return null
  }

  // If the session has an author, fetch the author's data.
  const authorData = sessionData.authorId
    ? await db.query.users.findFirst({
        where: eq(users.id, sessionData.authorId),
      })
    : null

  // Combine the session data with the author data.
  return { ...sessionData, author: authorData }
}
