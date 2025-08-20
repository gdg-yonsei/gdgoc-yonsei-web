import 'server-only'
import db from '@/db'
import { eq } from 'drizzle-orm'
import { sessions } from '@/db/schema/sessions'
import { dbCache } from '@/lib/server/fetcher/db-cache'

export const preload = (sessionId: string) => {
  void getSession(sessionId)
}
export const getSession = dbCache(
  async (sessionId: string) =>
    db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    }),
  [],
  { tags: ['sessions'] }
)
