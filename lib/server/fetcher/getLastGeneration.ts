import db from '@/db'
import { desc } from 'drizzle-orm'
import { generations } from '@/db/schema/generations'
import cacheTag from '@/lib/server/cacheTag'

export default async function getLastGeneration() {
  'use cache'
  cacheTag('generations')
  return db.query.generations.findFirst({
    orderBy: desc(generations.startDate),
  })
}
