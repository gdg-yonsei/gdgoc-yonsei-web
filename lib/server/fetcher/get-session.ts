import 'server-only'
import db from '@/db'
import { eq } from 'drizzle-orm'
import { sessions } from '@/db/schema/sessions'
import cacheTag from '@/lib/server/cacheTag'

export const preload = (sessionId: string) => {
  void getSession(sessionId)
}
export async function getSession(sessionId: string) {
  'use cache'
  cacheTag('sessions')
  return db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
  })
}
