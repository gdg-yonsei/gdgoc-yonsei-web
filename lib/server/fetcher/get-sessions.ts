import 'server-only'
import db from '@/db'
import applyCacheTags from '@/lib/server/cacheTagT'
import { lte } from 'drizzle-orm'
import { sessions } from '@/db/schema/sessions'

export const preloadSessions = () => {
  void getSessions()
}

export async function getSessions() {
  'use cache'
  applyCacheTags('sessions')

  return db.query.sessions.findMany({
    with: {
      part: {
        with: {
          generation: true,
        },
      },
    },
    where: lte(sessions.endAt, new Date()),
  })
}
