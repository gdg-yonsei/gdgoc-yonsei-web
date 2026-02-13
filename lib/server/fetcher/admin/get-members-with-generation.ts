import db from '@/db'
import applyCacheTags from '@/lib/server/cacheTagT'

export const preloadMembersGroupedByGeneration = () => {
  void getMembersWithGeneration()
}

export async function getMembersWithGeneration() {
  'use cache'
  applyCacheTags('members', 'generations')

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
