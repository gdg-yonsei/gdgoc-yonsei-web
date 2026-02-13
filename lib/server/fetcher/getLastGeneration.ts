import db from '@/db'
import { desc } from 'drizzle-orm'
import { generations } from '@/db/schema/generations'
import applyCacheTags from '@/lib/server/cacheTagT'

export default async function getLatestGeneration() {
  'use cache'
  applyCacheTags('generations')
  return db.query.generations.findFirst({
    orderBy: desc(generations.startDate),
  })
}
