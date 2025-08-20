import 'server-only'
import db from '@/db'
import { desc, eq } from 'drizzle-orm'
import { parts } from '@/db/schema/parts'
import cacheTag from '@/lib/server/cacheTag'

export const preload = (partId: number) => {
  void getPart(partId)
}

export async function getPart(partId: number) {
  'use cache'
  cacheTag('parts', 'members')

  console.log(new Date(), 'Fetch Part Data', partId)
  return db.query.parts.findFirst({
    where: eq(parts.id, partId),
    with: {
      usersToParts: {
        with: {
          user: true, // Include the full user object for each member
        },
      },
    },
    orderBy: desc(parts.createdAt),
  })
}
