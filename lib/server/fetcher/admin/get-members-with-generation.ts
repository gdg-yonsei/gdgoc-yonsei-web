import db from '@/db'
import cacheTag from '@/lib/server/cacheTag'

export const preload = () => {
  void getMembersWithGeneration()
}

export async function getMembersWithGeneration() {
  'use cache'
  cacheTag('members', 'generations')

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
