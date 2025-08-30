'use cache'

import db from '@/db'
import { generations } from '@/db/schema/generations'
import { desc } from 'drizzle-orm'

export default async function getGenerationList() {
  return db
    .select({ id: generations.id, name: generations.name })
    .from(generations)
    .orderBy(desc(generations.startDate))
}
