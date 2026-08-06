import 'server-only'
import db from '@/db'
import { generations } from '@/db/schema/generations'
import { desc } from 'drizzle-orm'
import { unstable_noStore as noStore } from 'next/cache'

export async function getGenerations() {
  noStore()
  return db.select().from(generations).orderBy(desc(generations.id))
}
