import 'server-only'
import { unstable_cache } from 'next/cache'
import db from '@/db'
import { generations } from '@/db/schema/generations'
import { desc, eq } from 'drizzle-orm'

export const preload = (generationId: number) => {
  void getGeneration(generationId)
}

export const getGeneration = unstable_cache(
  async (generationId: number) => {
    console.log(new Date(), 'Fetch Generation Data')
    return (
      await db
        .select()
        .from(generations)
        .where(eq(generations.id, generationId))
        .orderBy(desc(generations.id))
        .limit(1)
    )[0]
  },
  [],
  {
    tags: ['generations'],
  }
)
