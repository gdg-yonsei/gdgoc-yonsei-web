import 'server-only'
import db from '@/db'
import { generations } from '@/db/schema/generations'
import { desc } from 'drizzle-orm'
import cacheTag from '@/lib/server/cacheTag'

export const preload = () => {
  void getGenerations()
}

export async function getGenerations() {
  'use cache'
  cacheTag('generations')

  console.log(new Date(), 'Fetch Generations Data')
  return db.select().from(generations).orderBy(desc(generations.id))
}
