import 'server-only'
import db from '@/db'
import { desc, eq } from 'drizzle-orm'
import { parts } from '@/db/schema/parts'
import { unstable_noStore as noStore } from 'next/cache'

export async function getPart(partId: number) {
  noStore()
  return db.query.parts.findFirst({
    where: eq(parts.id, partId),
    with: {
      generation: true,
      usersToParts: {
        with: {
          user: true, // Include the full user object for each member
        },
      },
    },
    orderBy: desc(parts.createdAt),
  })
}
