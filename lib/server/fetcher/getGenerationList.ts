'use cache'

import db from '@/db'
import { generations } from '@/db/schema/generations'
import { asc } from 'drizzle-orm'
import cacheTagT from '@/lib/server/cacheTagT'

export default async function getGenerationList() {
  cacheTagT('generations')

  return db
    .select({ id: generations.id, name: generations.name })
    .from(generations)
    .orderBy(asc(generations.startDate))
}
