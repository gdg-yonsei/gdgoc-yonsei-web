import 'server-only'
import { unstable_cache } from 'next/cache'
import db from '@/db'
import { eq } from 'drizzle-orm'
import { parts } from '@/db/schema/parts'

export const preload = (partId: number) => {
  void getPart(partId)
}

export const getPart = unstable_cache(
  async (partId: number) => {
    console.log(new Date(), 'Fetch Part Data', partId)
    return db.query.parts.findFirst({
      where: eq(parts.id, partId),
      with: {
        usersToParts: {
          with: {
            user: true,
          },
        },
      },
    })
  },
  [],
  {
    tags: ['parts'],
  }
)
