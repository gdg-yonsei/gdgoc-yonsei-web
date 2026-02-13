import 'server-only'
import db from '@/db'
import { generations } from '@/db/schema/generations'
import { desc } from 'drizzle-orm'
import applyCacheTags from '@/lib/server/cacheTagT'

export const preloadAdminGenerations = () => {
  void getGenerations()
}

export async function getGenerations() {
  'use cache'
  applyCacheTags('generations')

  console.log(new Date(), 'Fetch Generations Data')
  return db.select().from(generations).orderBy(desc(generations.id))
}
