import db from '@/db'
import { desc } from 'drizzle-orm'
import { generations } from '@/db/schema/generations'
import cacheTagT from '@/lib/server/cacheTagT'

export default async function getLastGeneration() {
  'use cache'
  cacheTagT('generations')
  return db.query.generations.findFirst({
    orderBy: desc(generations.startDate),
  })
}
