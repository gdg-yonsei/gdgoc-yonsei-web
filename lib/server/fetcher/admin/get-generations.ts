import 'server-only'
import db from '@/db'
import { generations } from '@/db/schema/generations'
import { desc } from 'drizzle-orm'
import cacheTagT from '@/lib/server/cacheTagT'

export const preload = () => {
  void getGenerations()
}

export async function getGenerations() {
  'use cache'
  cacheTagT('generations')

  console.log(new Date(), 'Fetch Generations Data')
  return db.select().from(generations).orderBy(desc(generations.id))
}
