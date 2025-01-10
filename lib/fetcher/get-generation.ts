import 'server-only'
import { unstable_cache } from 'next/cache'
import db from '@/db'
import { generations } from '@/db/schema/generations'
import { eq } from 'drizzle-orm'

export const preload = (generationId: number) => {
  void getGeneration(generationId)
}

export const getGeneration = unstable_cache(
  async (generationId: number) => {
    console.log(new Date(), 'Fetch Generation Data', generationId)
    return db.query.generations.findFirst({
      where: eq(generations.id, generationId),
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
    })
  },
  [],
  {
    tags: ['generations'],
  }
)
