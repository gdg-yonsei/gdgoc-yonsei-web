import { unstable_cache } from 'next/cache'
import db from '@/db'

export const preload = () => {
  void getMembersWithGeneration()
}

export const getMembersWithGeneration = unstable_cache(
  async () =>
    db.query.generations.findMany({
      with: {
        parts: {
          with: {
            usersToParts: {
              with: {
                user: true,
              },
            },
          },
        },
      },
    }),
  [],
  {
    tags: ['generations', 'members'],
  }
)
