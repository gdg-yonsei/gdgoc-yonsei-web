import 'server-only'
import { unstable_cache } from 'next/cache'
import db from '@/db'
import { desc } from 'drizzle-orm'
import { generations } from '@/db/schema/generations'
import { parts } from '@/db/schema/parts'

export const preload = () => {
  void getParts()
}

/**
 * Get Parts Data
 */
export const getParts = unstable_cache(
  async () => {
    console.log(new Date(), 'Fetch Parts Data')
    return db.query.generations.findMany({
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
      orderBy: [desc(generations.id), desc(parts.createdAt)],
    })
  },
  [],
  {
    tags: ['parts'],
  }
)
