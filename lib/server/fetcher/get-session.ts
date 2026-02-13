import 'server-only'
import db from '@/db'
import { and, eq, lte } from 'drizzle-orm'
import { sessions } from '@/db/schema/sessions'
import applyCacheTags from '@/lib/server/cacheTagT'

export const preloadSessionById = (sessionId: string) => {
  void getSession(sessionId)
}

export async function getSession(sessionId: string) {
  'use cache'
  applyCacheTags('sessions')

  return db.query.sessions.findFirst({
    where: and(
      eq(sessions.id, sessionId),
      lte(sessions.endAt, new Date()),
      eq(sessions.displayOnWebsite, true)
    ),
  })
}
