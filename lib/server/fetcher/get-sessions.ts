import 'server-only'
import db from '@/db'
import { dbCache } from '@/lib/server/fetcher/db-cache'

export const preload = () => {
  void getSessions()
}

export const getSessions = dbCache(
  async () =>
    db.query.sessions.findMany({
      with: {
        part: {
          with: {
            generation: true,
          },
        },
      },
    }),
  [],
  {
    tags: ['sessions'],
  }
)
