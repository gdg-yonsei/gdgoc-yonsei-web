import 'server-only'
import db from '@/db'
import cacheTagT from '@/lib/server/cacheTagT'
import { lte } from 'drizzle-orm'
import { sessions } from '@/db/schema/sessions'

export const preload = () => {
  void getSessions()
}

export async function getSessions() {
  'use cache'
  cacheTagT('sessions')

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
