import 'server-only'
import db from '@/db'
import cacheTag from '@/lib/server/cacheTag'

export const preload = () => {
  void getSessions()
}

export async function getSessions() {
  'use cache'
  cacheTag('sessions')

  return db.query.sessions.findMany({
    with: {
      part: {
        with: {
          generation: true,
        },
      },
    },
  })
}
