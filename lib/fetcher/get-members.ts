import db from '@/db'
import { unstable_cache } from 'next/cache'

export const preload = () => {
  void getMembers()
}

export const getMembers = unstable_cache(
  async () =>
    db.query.users.findMany({
      with: {
        usersToParts: {
          with: {
            part: true,
          },
          limit: 1,
        },
      },
    }),
  [],
  {
    tags: ['members'],
  }
)
