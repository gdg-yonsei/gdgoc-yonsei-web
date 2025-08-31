'use cache'

import db from '@/db'
import { generations } from '@/db/schema/generations'
import { desc } from 'drizzle-orm'
import cacheTag from '@/lib/server/cacheTag'

export default async function getGenerationList() {
  cacheTag('generations')
  return db
    .select({ id: generations.id, name: generations.name })
    .from(generations)
    .orderBy(desc(generations.startDate))
}
