import db from '@/db'
import cacheTagT from '@/lib/server/cacheTagT'

export const preload = () => {
  void getMembersWithGeneration()
}

export async function getMembersWithGeneration() {
  'use cache'
  cacheTagT('members', 'generations')

  return db.query.generations.findMany({
    with: {
      parts: {
        with: {
          usersToParts: {
            with: {
              user: true, // Include the full user object for each member
            },
          },
        },
      },
    },
  })
}
