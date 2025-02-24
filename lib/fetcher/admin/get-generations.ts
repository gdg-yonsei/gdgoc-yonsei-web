import 'server-only'
import { unstable_cache } from 'next/cache'
import db from '@/db'
import { generations } from '@/db/schema/generations'
import { desc } from 'drizzle-orm'

export const preload = () => {
  void getGenerations()
}

/**
 * Get Generations Data
 */
export const getGenerations = unstable_cache(
  async () => {
    console.log(new Date(), 'Fetch Generations Data')
    return db.select().from(generations).orderBy(desc(generations.id))
  },
  [],
  {
    tags: ['generations'],
  }
)
