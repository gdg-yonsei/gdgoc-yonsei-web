import 'server-only'
import db from '@/db'
import { generations } from '@/db/schema/generations'
import { desc } from 'drizzle-orm'

export async function getGenerations() {
  return db.select().from(generations).orderBy(desc(generations.id))
}
