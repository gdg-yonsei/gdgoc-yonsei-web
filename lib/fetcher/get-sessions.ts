import 'server-only'
import { unstable_cache } from 'next/cache'
import db from '@/db'

export const preload = () => {
  void getSessions()
}

export const getSessions = unstable_cache(
  async () =>
    db.query.sessions.findMany({
      with: {
        generation: true,
      },
    }),
  [],
  {
    tags: ['sessions'],
  }
)
