import 'server-only'
import { unstable_cache } from 'next/cache'
import db from '@/db'
import { eq } from 'drizzle-orm'
import { sessions } from '@/db/schema/sessions'

export const preload = (sessionId: string) => {
  void getSession(sessionId)
}
export const getSession = unstable_cache(
  async (sessionId: string) =>
    db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    }),
  [],
  { tags: ['sessions'] }
)
