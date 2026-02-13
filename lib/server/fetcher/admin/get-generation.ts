import 'server-only'
import db from '@/db'
import { generations } from '@/db/schema/generations'
import { eq } from 'drizzle-orm'
import applyCacheTags from '@/lib/server/cacheTagT'

export const preloadAdminGenerationById = (generationId: number) => {
  void getGeneration(generationId)
}

export async function getGeneration(generationId: number) {
  'use cache'
  applyCacheTags('generations', 'members', 'parts')

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
}
