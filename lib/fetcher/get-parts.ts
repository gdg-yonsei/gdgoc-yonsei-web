import 'server-only'
import { unstable_cache } from 'next/cache'
import db from '@/db'
import { asc } from 'drizzle-orm'
import { generations } from '@/db/schema/generations'

export const preload = () => {
  void getParts()
}

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
      orderBy: [asc(generations.id)],
    })
  },
  [],
  {
    tags: ['parts'],
  }
)
